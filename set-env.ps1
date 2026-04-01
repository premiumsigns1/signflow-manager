$url = "libsql://signflow-nickhodson1.aws-eu-west-1.turso.io"
$token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1OTUxMTMsImlkIjoiNzAwYzk1NTMtMDU3ZC00ZDhmLThmMzktZWJmODM1ODk2NzNlIiwicmlkIjoiYmYyZTY5NzAtMWU3MC00NGU5LTliYTQtMGRiNWZiZWIyODY0In0.SJDZDSxmKEfb-Rs_FW4b0XefLXaFK3JNd5SnbkpIbrlopkCxI1Jn3ueVcv2ILJX4kZCDBhuVS2hx863w5jSKBA"

Set-Location "C:\Users\info\.openclaw\workspace\signflow-manager\client"

# Use printf-style to avoid newlines
[System.IO.File]::WriteAllText("$env:TEMP\turso_url.txt", $url)
[System.IO.File]::WriteAllText("$env:TEMP\turso_token.txt", $token)

Get-Content "$env:TEMP\turso_url.txt" | npx vercel env add TURSO_DATABASE_URL production preview development
Get-Content "$env:TEMP\turso_token.txt" | npx vercel env add TURSO_AUTH_TOKEN production preview development
