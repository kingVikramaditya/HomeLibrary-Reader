param([int]$Port = 4891)

$root = $PSScriptRoot
if (-not $root) { $root = "h:\Nandan\Antigravity" }

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
    $listener.Start()
    Write-Output "HomeLibrary server listening at http://localhost:$Port/"
} catch {
    Write-Output "Server already running or port $Port occupied: $($_.Exception.Message)"
    exit 0
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".webp" = "image/webp"
    ".svg"  = "image/svg+xml"
    ".pdf"  = "application/pdf"
    ".epub" = "application/epub+zip"
    ".docx" = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ".txt"  = "text/plain; charset=utf-8"
}

try {
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            # Add global CORS headers
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $response.AddHeader("Access-Control-Allow-Headers", "*")

            if ($request.HttpMethod -eq "OPTIONS") {
                $response.StatusCode = 200
                try { $response.OutputStream.Close() } catch {}
                continue
            }

        $rawPath = $request.Url.LocalPath.TrimStart('/')
        
        # ------------------------------------------------------------------
        # API ROUTE: /api/archive/metadata?id=...
        # ------------------------------------------------------------------
        if ($rawPath -eq "api/archive/metadata") {
            $id = $request.QueryString["id"]
            if (-not $id) {
                $response.StatusCode = 400
                $msg = [System.Text.Encoding]::UTF8.GetBytes('{"error": "Missing id parameter"}')
                $response.ContentType = "application/json"
                $response.OutputStream.Write($msg, 0, $msg.Length)
                $response.OutputStream.Close()
                continue
            }

            try {
                $targetUrl = "https://archive.org/metadata/$id"
                $webReq = [System.Net.HttpWebRequest]::Create($targetUrl)
                $webReq.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HomeLibrary/2.0"
                $webReq.Timeout = 60000
                $webResp = $webReq.GetResponse()
                $stream = $webResp.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $json = $reader.ReadToEnd()
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)

                $response.ContentType = "application/json"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $response.StatusCode = 502
                $errMsg = [System.Text.Encoding]::UTF8.GetBytes("{`"error`": `"$($_.Exception.Message)`"}")
                $response.ContentType = "application/json"
                $response.OutputStream.Write($errMsg, 0, $errMsg.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # ------------------------------------------------------------------
        # API ROUTE: /api/archive/download?id=...&file=...
        # ------------------------------------------------------------------
        if ($rawPath -eq "api/archive/download") {
            $id = $request.QueryString["id"]
            $fileName = $request.QueryString["file"]
            if (-not $id -or -not $fileName) {
                $response.StatusCode = 400
                $msg = [System.Text.Encoding]::UTF8.GetBytes('{"error": "Missing id or file parameter"}')
                $response.ContentType = "application/json"
                $response.OutputStream.Write($msg, 0, $msg.Length)
                $response.OutputStream.Close()
                continue
            }

            try {
                $encodedFile = [System.Uri]::EscapeDataString($fileName)
                $targetUrl = "https://archive.org/download/$id/$encodedFile"
                $webReq = [System.Net.HttpWebRequest]::Create($targetUrl)
                $webReq.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HomeLibrary/2.0"
                $webReq.Timeout = 300000
                $webReq.AllowAutoRedirect = $true
                $webResp = $webReq.GetResponse()

                $response.ContentType = $webResp.ContentType
                if ($webResp.ContentLength -gt 0) {
                    $response.ContentLength64 = $webResp.ContentLength
                }

                $inStream = $webResp.GetResponseStream()
                $buffer = New-Object byte[] 65536
                $read = 0
                while (($read = $inStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
                    $response.OutputStream.Write($buffer, 0, $read)
                }
                $inStream.Close()
            } catch {
                $response.StatusCode = 502
                $errMsg = [System.Text.Encoding]::UTF8.GetBytes("{`"error`": `"$($_.Exception.Message)`"}")
                $response.ContentType = "application/json"
                $response.OutputStream.Write($errMsg, 0, $errMsg.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # ------------------------------------------------------------------
        # API ROUTE: /api/archive/save_extracted (POST)
        # Saves to "Internet Archive Books/{title}/..."
        # ------------------------------------------------------------------
        if ($rawPath -eq "api/archive/save_extracted" -and $request.HttpMethod -eq "POST") {
            try {
                $encoding = if ($request.ContentEncoding) { $request.ContentEncoding } else { [System.Text.Encoding]::UTF8 }
                $streamReader = New-Object System.IO.StreamReader($request.InputStream, $encoding)
                $postData = $streamReader.ReadToEnd()
                $jsonObj = ConvertFrom-Json $postData

                $cleanTitle = $jsonObj.title -replace '[^\w\s-]', ''
                $cleanTitle = $cleanTitle.Trim()
                if (-not $cleanTitle) { $cleanTitle = "Archive_Book_" + (Get-Date -Format "yyyyMMdd_HHmmss") }

                $archiveRoot = Join-Path $root "Internet Archive Books"
                $mainFolder = Join-Path $archiveRoot $cleanTitle
                $srcFolder = Join-Path $mainFolder "01_Source"
                $extFolder = Join-Path $mainFolder "02_Extracted"
                $ragFolder = Join-Path $mainFolder "03_RAG"

                New-Item -ItemType Directory -Path $srcFolder -Force | Out-Null
                New-Item -ItemType Directory -Path $extFolder -Force | Out-Null
                New-Item -ItemType Directory -Path $ragFolder -Force | Out-Null

                # Save metadata.json
                if ($jsonObj.metadata) {
                    $metaJson = ConvertTo-Json $jsonObj.metadata -Depth 10
                    [System.IO.File]::WriteAllText((Join-Path $srcFolder "metadata.json"), $metaJson, [System.Text.Encoding]::UTF8)
                }

                # Save extracted text
                if ($jsonObj.txtContent) {
                    [System.IO.File]::WriteAllText((Join-Path $extFolder "$cleanTitle.txt"), $jsonObj.txtContent, [System.Text.Encoding]::UTF8)
                }

                # Save JSON
                if ($jsonObj.jsonContent) {
                    [System.IO.File]::WriteAllText((Join-Path $extFolder "$cleanTitle.json"), $jsonObj.jsonContent, [System.Text.Encoding]::UTF8)
                }

                # Save DOCX if provided
                if ($jsonObj.docxBase64) {
                    $docxBytes = [System.Convert]::FromBase64String($jsonObj.docxBase64)
                    [System.IO.File]::WriteAllBytes((Join-Path $extFolder "$cleanTitle.docx"), $docxBytes)
                }

                $respBytes = [System.Text.Encoding]::UTF8.GetBytes("{`"success`": true, `"folder`": `"$cleanTitle`"}")
                $response.ContentType = "application/json"
                $response.OutputStream.Write($respBytes, 0, $respBytes.Length)
            } catch {
                $response.StatusCode = 500
                $errMsg = [System.Text.Encoding]::UTF8.GetBytes("{`"error`": `"$($_.Exception.Message)`"}")
                $response.ContentType = "application/json"
                $response.OutputStream.Write($errMsg, 0, $errMsg.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # ------------------------------------------------------------------
        # STATIC FILES
        # ------------------------------------------------------------------
        if (-not $rawPath -or $rawPath -eq "") { $rawPath = "index.html" }
        $filePath = Join-Path $root ($rawPath.Replace('/', '\'))

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $response.ContentType = $mime

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rawPath")
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }
        try { $response.OutputStream.Close() } catch {}
    } catch {
        Write-Host "Request handler error: $($_.Exception.Message)"
        try { $response.OutputStream.Close() } catch {}
    }
}
} finally {
    $listener.Stop()
}
