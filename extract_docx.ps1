$word = New-Object -ComObject Word.Application
$currentDir = Get-Location
$filePath = Join-Path $currentDir "order booking system.docx"
try {
    $doc = $word.Documents.Open($filePath)
    $text = $doc.Content.Text
    $text | Out-File -FilePath "requirements.txt" -Encoding utf8
    $doc.Close()
} catch {
    Write-Error $_.Exception.Message
} finally {
    $word.Quit()
}
