#Requires -Version 7.0
param([string]$DotNet='dotnet',[Parameter(Mandatory)][string]$AssemblyPath)
$ErrorActionPreference='Stop'
$sdk=(Get-Command $DotNet -ErrorAction Stop).Source
$assembly=(Resolve-Path -LiteralPath $AssemblyPath).Path
$owner=[Security.Principal.WindowsIdentity]::GetCurrent().User
$temporaryRoot=[IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$testRoot=Join-Path $temporaryRoot ('talin-bootstrap-tests-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot|Out-Null
$privateAcl=New-Object Security.AccessControl.DirectorySecurity
$privateAcl.SetAccessRuleProtection($true,$false)
$privateAcl.SetOwner($owner)
$privateAcl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($owner,'FullControl','ContainerInherit,ObjectInherit','None','Allow')))
Set-Acl -LiteralPath $testRoot -AclObject $privateAcl
function Invoke-TestAgent([string[]]$AgentArguments){
  $start=New-Object Diagnostics.ProcessStartInfo
  $start.FileName=$sdk
  $start.UseShellExecute=$false
  $start.CreateNoWindow=$true
  $start.RedirectStandardOutput=$true
  $start.RedirectStandardError=$true
  $start.ArgumentList.Add($assembly)
  foreach($argument in $AgentArguments){$start.ArgumentList.Add($argument)}
  $process=[Diagnostics.Process]::Start($start)
  $output=$process.StandardOutput.ReadToEndAsync()
  $errorOutput=$process.StandardError.ReadToEndAsync()
  if(!$process.WaitForExit(30000)){$process.Kill();throw 'Bootstrap test process timed out'}
  $output.GetAwaiter().GetResult()|Out-Null
  $errorOutput.GetAwaiter().GetResult()|Out-Null
  $exitCode=$process.ExitCode
  $process.Dispose()
  return $exitCode
}
try{
  $wrong=Join-Path $testRoot 'wrong.dpapi'
  $wrongState=Join-Path $testRoot 'wrong-state'
  $wrongSid=if($owner.Value -eq 'S-1-5-18'){'S-1-5-19'}else{'S-1-5-18'}
  if((Invoke-TestAgent @('--prepare-bootstrap','--target-sid',$wrongSid,'--bootstrap-output',$wrong)) -ne 0){throw 'Wrong-user fixture creation failed'}
  if((Invoke-TestAgent @('--prepare','--bootstrap',$wrong,'--state-dir',$wrongState)) -eq 0 -or (Test-Path -LiteralPath (Join-Path $wrongState 'companion.dpapi')) -or !(Test-Path -LiteralPath $wrong)){throw 'Wrong Windows account was not rejected'}
  $good=Join-Path $testRoot 'good.dpapi'
  $goodState=Join-Path $testRoot 'good-state'
  if((Invoke-TestAgent @('--prepare-bootstrap','--target-sid',$owner.Value,'--bootstrap-output',$good)) -ne 0){throw 'Private fixture creation failed'}
  if((Invoke-TestAgent @('--prepare','--bootstrap',$good,'--state-dir',$goodState)) -ne 0){throw 'Current-user sealing failed'}
  $expected=Get-Content -LiteralPath ($good+'.request.json') -Raw|ConvertFrom-Json
  $actual=Get-Content -LiteralPath (Join-Path $goodState 'pairing-request.json') -Raw|ConvertFrom-Json
  if($expected.tokenHash -ne $actual.tokenHash -or !(Test-Path -LiteralPath (Join-Path $goodState 'companion.dpapi')) -or (Test-Path -LiteralPath $good)){throw 'Credential preservation/consumption failed'}
  $broad=Join-Path $testRoot 'broad'
  New-Item -ItemType Directory -Path $broad|Out-Null
  $broadAcl=Get-Acl -LiteralPath $broad
  $broadAcl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule(([Security.Principal.SecurityIdentifier]'S-1-5-11'),'ReadAndExecute','Allow')))
  Set-Acl -LiteralPath $broad -AclObject $broadAcl
  $publicOutput=Join-Path $broad 'denied.dpapi'
  if((Invoke-TestAgent @('--prepare-bootstrap','--target-sid',$owner.Value,'--bootstrap-output',$publicOutput)) -eq 0 -or (Test-Path -LiteralPath $publicOutput)){throw 'Broadly readable output was not rejected'}
  '4 Windows bootstrap security checks passed; no credentials printed.'
}finally{
  $resolved=[IO.Path]::GetFullPath($testRoot)
  if($resolved.StartsWith($temporaryRoot,[StringComparison]::OrdinalIgnoreCase) -and (Split-Path $resolved -Leaf).StartsWith('talin-bootstrap-tests-')){Remove-Item -LiteralPath $resolved -Recurse -Force}
}
