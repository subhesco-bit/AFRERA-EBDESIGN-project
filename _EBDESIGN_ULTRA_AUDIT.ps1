$ErrorActionPreference="Continue"
$Root=(Get-Location).Path
$Stamp=Get-Date -Format "yyyyMMdd_HHmmss"
$Out="$env:USERPROFILE\Desktop\EBDESIGN_ULTRA_AUDIT\$Stamp"
New-Item -ItemType Directory -Force -Path $Out | Out-Null

$Files=[System.Collections.Generic.List[object]]::new()
$Folders=[System.Collections.Generic.List[object]]::new()
$Errors=[System.Collections.Generic.List[object]]::new()
$Links=[System.Collections.Generic.List[object]]::new()
$Refs=[System.Collections.Generic.List[object]]::new()

$TextExt=@(
".ps1",".psm1",".psd1",".ps1xml",".cmd",".bat",".sh",
".cs",".csproj",".sln",".fs",".fsproj",".vb",".vbproj",
".ts",".tsx",".js",".jsx",".mjs",".cjs",".vue",".svelte",".astro",
".html",".htm",".css",".scss",".less",
".py",".pyw",".go",".rs",".java",".kt",".kts",".php",".rb",
".json",".jsonc",".yaml",".yml",".toml",".xml",".ini",".cfg",".conf",
".env",".env.example",".properties",".sql",".graphql",".gql",".proto",
".md",".mdx",".txt",".rst",".adoc",
".dockerfile",".tf",".hcl",".gradle",".prisma",".cshtml",".razor",".xaml"
)

$ClaudeTerms=@(
"anthropic","claude","claude-code","claude.ai","@anthropic",
"anthropic-sdk","anthropic_api","model context protocol","mcp",
".claude","claude_desktop","claude-sonnet","claude-opus","claude-haiku"
)

$AIProviders=@{
"Anthropic/Claude"=@("anthropic","claude","@anthropic")
"OpenAI"=@("openai","gpt-","chatgpt")
"Google/Gemini"=@("gemini","generativeai","vertexai")
"DeepSeek"=@("deepseek")
"Ollama"=@("ollama")
"Mistral"=@("mistral")
"Groq"=@("groq")
"Cohere"=@("cohere")
"AWS Bedrock"=@("bedrock")
"HuggingFace"=@("huggingface","transformers")
"LangChain"=@("langchain","langgraph")
"LlamaIndex"=@("llamaindex")
"MCP"=@("mcp","model context protocol")
}

$Architecture=@{
"CLAUDE / AI INTEGRATION"=@("claude","anthropic",".claude","mcp")
"AI MODULE"=@("ai","agent","agents","llm","ml","model","prompt","embedding","rag","vector","inference","copilot")
"API"=@("api","apis","controller","controllers","endpoint","endpoints","route","routes","router","graphql","grpc","webhook","middleware")
"FRONTEND / UI"=@("frontend","front-end","client","web","ui","component","components","pages","views","screens","dashboard","portal","react","next","vue","svelte","angular","vite")
"BACKEND"=@("backend","back-end","server","servers","service","services","worker","workers","queue","job","jobs")
"DOMAIN"=@("domain","core","entity","entities","business","businesslogic","business-rules","usecase","usecases","application")
"PLATFORM"=@("platform","infrastructure","infra","runtime","shared","common","adapter","adapters","sdk","kernel","framework")
"ENTERPRISE"=@("enterprise","tenant","tenants","organization","organizations","rbac","iam","identity","sso","audit","compliance","billing","approval","workflow")
"ERP"=@("erp","finance","accounting","inventory","procurement","purchase","sales","crm","hr","payroll","warehouse","supply","manufacturing","production","asset")
"STRATEGY"=@("strategy","strategic","planning","roadmap","policy","dpr","investment","financial","subsidy","business-plan","businessplan")
"DATA / DATABASE"=@("data","database","db","schema","migration","migrations","seed","etl","warehouse","repository","repositories","orm","sql")
"SECURITY"=@("security","auth","authentication","authorization","permission","permissions","certificate","cert")
"TEST"=@("test","tests","spec","specs","fixture","fixtures","mock","mocks","e2e")
"DOCUMENTATION"=@("docs","documentation","readme","readme.md","adr","architecture","design","report","proposal")
"BUILD / DEVOPS"=@("build","deploy","deployment","docker","terraform","pipeline","pipelines","scripts","tools",".github",".devcontainer")
"CONFIGURATION"=@("config","configuration","settings","manifest","package.json","tsconfig","vite.config","next.config")
}

$JunkIndicators=@(
"temp","tmp","backup","bak","old","copy","copy of","scratch",
"dump","debug","unused","deprecated","obsolete","archive","legacy",
"final-final","final2","cache","coverage"
)

$GeneratedDirectories=@(
"node_modules","bin","obj","dist","build","out",".next",".nuxt",
".turbo","__pycache__",".pytest_cache",".venv","venv","coverage",
".cache","target"
)

function Get-Relative($Path){
    try{return [IO.Path]::GetRelativePath($Root,$Path)}
    catch{return $Path}
}

function Read-SafeText($File){
    try{
        if($File.Length -gt 20MB){return $null}
        if(($TextExt -contains $File.Extension.ToLowerInvariant()) -or
           ($File.Name -match '^(Dockerfile|Makefile|Procfile|README.*|LICENSE.*|CLAUDE\.md)$')){
            return [IO.File]::ReadAllText($File.FullName)
        }
    }catch{
        $Errors.Add([pscustomobject]@{
            Type="CONTENT_READ_ERROR"
            Path=$File.FullName
            Error=$_.Exception.Message
        })
    }
    return $null
}

function Get-BinaryType($File){
    try{
        if($File.Length -eq 0){return "EMPTY"}
        $n=[Math]::Min(16,$File.Length)
        $b=New-Object byte[] $n
        $s=[IO.File]::OpenRead($File.FullName)
        try{[void]$s.Read($b,0,$n)}finally{$s.Dispose()}
        $h=($b|ForEach-Object ToString x2)-join ""
        if($h.StartsWith("89504E47")){"PNG"}
        elseif($h.StartsWith("FFD8FF")){"JPEG"}
        elseif($h.StartsWith("25504446")){"PDF"}
        elseif($h.StartsWith("504B0304")){"ZIP/OFFICE/JAR"}
        elseif($h.StartsWith("4D5A")){"PE/EXE/DLL"}
        elseif($h.StartsWith("7F454C46")){"ELF"}
        elseif($h.StartsWith("D0CF11E0")){"OLE"}
        elseif($h.StartsWith("CAFEBABE")){"JAVA CLASS"}
        elseif($h.StartsWith("1F8B")){"GZIP"}
        elseif($h.StartsWith("526172")){"RAR"}
        elseif($h.StartsWith("494433")){"MP3"}
        elseif($h.StartsWith("52494646")){"RIFF"}
        elseif($h.StartsWith("66747970")){"MP4/ISO MEDIA"}
        else{"BINARY/UNKNOWN"}
    }catch{"UNREADABLE"}
}

function Get-Architecture($Hay){
    $scores=@{}
    foreach($g in $Architecture.Keys){
        $scores[$g]=0
        foreach($t in $Architecture[$g]){
            if($Hay.Contains($t.ToLowerInvariant())){$scores[$g]++}
        }
    }
    $top=$scores.GetEnumerator()|Sort-Object Value -Descending|Select-Object -First 1
    if($top -and $top.Value -gt 0){return $top.Name}
    return "SYSTEM / UNCLASSIFIED"
}

function Get-Purpose($File,$Text){
    $n=$File.Name.ToLowerInvariant()
    if($n -match "claude"){"Claude instructions/integration/configuration"}
    elseif($n -match "route|router"){"Routing / application entry point"}
    elseif($n -match "controller"){"API controller"}
    elseif($n -match "service"){"Service / business logic"}
    elseif($n -match "repository|repo"){"Data access / repository"}
    elseif($n -match "schema|migration"){"Database schema / migration"}
    elseif($n -match "component"){"UI component"}
    elseif($n -match "page|screen|view"){"Frontend page/view"}
    elseif($n -match "test|spec"){"Automated test"}
    elseif($n -match "config|settings|manifest"){"Configuration"}
    elseif($n -match "readme|docs"){"Documentation"}
    elseif($n -match "package|requirements|cargo|go.mod|pom.xml|csproj"){"Dependency/project manifest"}
    elseif($Text -and $Text -match "(?i)\b(class|interface|function|def|export|module|namespace)\b"){"Source code / implementation"}
    else{"File requires direct content inspection"}
}

function Get-JunkAssessment($Hay,$Ext,$Parts){
    $score=0
    $why=[System.Collections.Generic.List[string]]::new()
    foreach($x in $JunkIndicators){
        if($Hay.Contains($x)){$score+=2;$why.Add("indicator:$x")}
    }
    foreach($x in $GeneratedDirectories){
        if($Parts -contains $x){$score+=6;$why.Add("generated/dependency-directory:$x")}
    }
    if($Ext -in @(".log",".tmp",".bak",".old",".dmp",".swp",".swo")){
        $score+=5;$why.Add("temporary-extension")
    }
    if($score -ge 6){"LIKELY JUNK/GENERATED|"+($why -join ";")}
    elseif($score -ge 2){"REVIEW / POSSIBLE RECOVERY VALUE|"+($why -join ";")}
    else{"NO JUNK INDICATOR|"}
}

# Enumerate folders and files using a queue and do not follow directory reparse points.
$q=[System.Collections.Generic.Queue[string]]::new()
$q.Enqueue($Root)
$Visited=[System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
[void]$Visited.Add($Root)

while($q.Count -gt 0){
    $D=$q.Dequeue()
    try{
        $di=Get-Item -LiteralPath $D -Force -ErrorAction Stop
        $Folders.Add([pscustomobject]@{
            AbsolutePath=$D
            RelativePath=(Get-Relative $D)
            Name=$di.Name
            Parent=if($di.Parent){$di.Parent.FullName}else{""}
            Attributes=$di.Attributes
        })
        foreach($e in Get-ChildItem -LiteralPath $D -Force -ErrorAction Stop){
            try{
                $rp=($e.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
                if($e.PSIsContainer){
                    if($rp){
                        $target=""
                        try{$target=(Get-Item $e.FullName -Force).Target}catch{}
                        $Links.Add([pscustomobject]@{Type="DIRECTORY_REPARSE_POINT";Path=$e.FullName;Target=$target})
                    }else{
                        if($Visited.Add($e.FullName)){$q.Enqueue($e.FullName)}
                    }
                }else{
                    $Files.Add($e)
                    if($rp){
                        $target=""
                        try{$target=(Get-Item $e.FullName -Force).Target}catch{}
                        $Links.Add([pscustomobject]@{Type="FILE_REPARSE_POINT";Path=$e.FullName;Target=$target})
                    }
                }
            }catch{
                $Errors.Add([pscustomobject]@{Type="ENTRY_ERROR";Path=$e.FullName;Error=$_.Exception.Message})
            }
        }
    }catch{
        $Errors.Add([pscustomobject]@{Type="DIRECTORY_ERROR";Path=$D;Error=$_.Exception.Message})
    }
}

# Analyze every enumerated file.
$Rows=foreach($F in $Files){
    $Rel=Get-Relative $F.FullName
    $Parts=if($Rel){$Rel -split '[\\/]'}else{@()}
    $Text=Read-SafeText $F
    $Hay=($Rel+" "+$F.Name+" "+[string]$Text).ToLowerInvariant()

    $ClaudeHits=@($ClaudeTerms|Where-Object{$Hay.Contains($_.ToLowerInvariant())}|Select-Object -Unique)
    $AIHits=@()
    foreach($Provider in $AIProviders.Keys){
        foreach($Term in $AIProviders[$Provider]){
            if($Hay.Contains($Term.ToLowerInvariant())){$AIHits+=$Provider;break}
        }
    }

    $RouteHits=@()
    if($Text){
        foreach($RX in @(
            '(?im)\b(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+(/[A-Za-z0-9_./:{}?=&-]+)',
            '(?im)(app|router)\.(get|post|put|patch|delete)\s*\(\s*["'']([^"'']+)',
            '(?im)@(Get|Post|Put|Patch|Delete)\s*\(\s*["'']?([^"'')]+)'
        )){
            try{$RouteHits+=([regex]::Matches($Text,$RX)|ForEach-Object Value)}catch{}
        }
    }

    $Hash=""
    try{$Hash=(Get-FileHash -LiteralPath $F.FullName -Algorithm SHA256).Hash}catch{
        $Errors.Add([pscustomobject]@{Type="HASH_ERROR";Path=$F.FullName;Error=$_.Exception.Message})
    }

    $Git="UNKNOWN"
    try{
        git -C $Root ls-files --error-unmatch -- "$Rel" 2>$null|Out-Null
        if($LASTEXITCODE -eq 0){$Git="TRACKED"}else{$Git="UNTRACKED / IGNORED / NEW"}
    }catch{}

    $J=Get-JunkAssessment $Hay $F.Extension.ToLowerInvariant() $Parts
    $JC=$J -split "\|",2

    $Secret=$false
    foreach($RX in @(
        '(?i)(api[_-]?key|secret|token|password|private[_-]?key)\s*[:=]\s*["'']?[^ "'']{12,}',
        '(?i)\bsk-[A-Za-z0-9_\-]{16,}\b',
        '(?i)\bAKIA[0-9A-Z]{16}\b',
        '(?i)-----BEGIN [A-Z ]+ PRIVATE KEY-----'
    )){
        if($Text -and $Text -match $RX){$Secret=$true;break}
    }

    $Layer=Get-Architecture $Hay
    $ClaudeState=if($ClaudeHits.Count -gt 0){"STATIC CLAUDE/ANTHROPIC/MCP EVIDENCE"}elseif($Layer -ne "SYSTEM / UNCLASSIFIED"){"ARCHITECTURALLY USEFUL CANDIDATE / NO CLAUDE STATIC EVIDENCE"}else{"NO CLAUDE STATIC EVIDENCE"}

    $Summary=if($Text){
        $Lines=@($Text -split "`r?`n")
        $Symbols=@([regex]::Matches($Text,'(?im)\b(class|interface|struct|enum|record|function|def|namespace|module)\s+([A-Za-z_][A-Za-z0-9_]*)')|ForEach-Object Value|Select-Object -Unique -First 80)
        "TEXT; lines=$($Lines.Count); symbols=$($Symbols -join ' | '); routes=$($RouteHits.Count)"
    }else{
        "BINARY/UNREAD-AS-TEXT; type=$(Get-BinaryType $F)"
    }

    [pscustomobject]@{
        FILE_ID=[guid]::NewGuid().ToString()
        ABSOLUTE_ADDRESS=$F.FullName
        RELATIVE_ADDRESS=$Rel
        FOLDER=$F.DirectoryName
        FILENAME=$F.Name
        EXTENSION=$F.Extension
        SIZE_BYTES=$F.Length
        SIZE_KB=[math]::Round($F.Length/1KB,2)
        SIZE_MB=[math]::Round($F.Length/1MB,3)
        CREATED=$F.CreationTime.ToString("s")
        MODIFIED=$F.LastWriteTime.ToString("s")
        ATTRIBUTES=$F.Attributes
        CONTENT_TYPE=if($Text){"TEXT"}else{Get-BinaryType $F}
        SHA256=$Hash
        GIT_STATE=$Git
        ARCHITECTURE_LAYER=$Layer
        PURPOSE=(Get-Purpose $F $Text)
        CLAUDE_STATUS=$ClaudeState
        CLAUDE_EVIDENCE=($ClaudeHits -join "; ")
        AI_PROVIDER_EVIDENCE=(($AIHits|Select-Object -Unique)-join "; ")
        ROUTE_API_EVIDENCE=(($RouteHits|Select-Object -Unique)-join " || ")
        ROUTE_COUNT=$RouteHits.Count
        READABLE_TEXT=([bool]$Text)
        SECRET_LIKE_CONTENT=$Secret
        JUNK_ASSESSMENT=$JC[0]
        JUNK_EVIDENCE=$JC[1]
        CONTENT_SUMMARY=$Summary
        CONTENT_PREVIEW=if($Text){(($Text -split "`r?`n"|Where-Object{$_.Trim()}|Select-Object -First 20)-join " ")}else{"Binary file: inspect directly at exact address"}
    }
}

# Export complete inventories.
$Rows|Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\01_MASTER_EVERY_FILE.csv"
$Rows|ConvertTo-Json -Depth 10|Set-Content -Encoding UTF8 "$Out\02_MASTER_EVERY_FILE.json"
$Folders|Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\03_EVERY_FOLDER.csv"
$Links|Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\04_REPARSE_POINTS_AND_LINKS.csv"
$Errors|Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\05_SCAN_ERRORS.csv"
$Rows|Where-Object ClaudeEvidence|Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\06_CLAUDE_CONNECTED_OR_REFERENCED.csv"
$Rows|Where-Object{$_ -notmatch "CLAUDE"}|Out-Null
$Rows|Where-Object{ -not $_.ClaudeEvidence }|Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\07_NO_CLAUDE_STATIC_EVIDENCE.csv"
$Rows|Where-Object AI_PROVIDER_EVIDENCE|Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\08_ALL_AI_PROVIDER_FILES.csv"
$Rows|Where-Object ROUTE_API_EVIDENCE|Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\09_ROUTES_API_ENTRYPOINTS.csv"
$Rows|Group-Object ARCHITECTURE_LAYER|ForEach-Object{
    [pscustomobject]@{
        ARCHITECTURE_GROUP=$_.Name
        FILE_COUNT=$_.Count
        EXACT_ADDRESSES=(($_.Group.ABSOLUTE_ADDRESS)-join " || ")
    }
}|Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\10_ARCHITECTURE_GROUP_INDEX.csv"
$Rows|Where-Object{$_.JUNK_ASSESSMENT -ne "NO JUNK INDICATOR"}|Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\11_JUNK_RECOVERY_REVIEW.csv"
$Rows|Group-Object SHA256|Where-Object Count -gt 1|ForEach-Object{
    $_.Group|Select-Object SHA256,SIZE_BYTES,ABSOLUTE_ADDRESS,ARCHITECTURE_LAYER
}|Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\12_DUPLICATE_CONTENT_CANDIDATES.csv"
$Refs|Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\13_REFERENCE_GRAPH.csv"

# Navigation index: exact addresses first, no destructive action.
$Index=[System.Collections.Generic.List[string]]::new()
$Index.Add("# EBDESIGN COMPLETE NAVIGATION / RECOVERY INDEX")
$Index.Add("")
$Index.Add("ROOT: $Root")
$Index.Add("AUDIT: $Out")
$Index.Add("FILES: $($Rows.Count)")
$Index.Add("FOLDERS: $($Folders.Count)")
$Index.Add("SCAN ERRORS: $($Errors.Count)")
$Index.Add("")
$Index.Add("## ARCHITECTURE GROUPS")
foreach($G in ($Rows|Group-Object ARCHITECTURE_LAYER|Sort-Object Name)){
    $Index.Add("### $($G.Name) — $($G.Count) files")
    foreach($X in ($G.Group|Sort-Object RELATIVE_ADDRESS)){
        $Index.Add("- `$($X.ABSOLUTE_ADDRESS)` | $($X.SIZE_BYTES) bytes | Claude=$([bool]$X.CLAUDE_EVIDENCE) | Purpose=$($X.PURPOSE)")
    }
}
$Index.Add("")
$Index.Add("## CLAUDE / AI CONNECTED")
foreach($X in ($Rows|Where-Object ClaudeEvidence|Sort-Object RELATIVE_ADDRESS)){
    $Index.Add("- `$($X.ABSOLUTE_ADDRESS)` | $($X.CONTENT_SUMMARY)")
}
$Index.Add("")
$Index.Add("## USEFUL CANDIDATES WITH NO STATIC CLAUDE EVIDENCE")
foreach($X in ($Rows|Where-Object{(-not $_.ClaudeEvidence) -and $_.ARCHITECTURE_LAYER -ne "SYSTEM / UNCLASSIFIED"}|Sort-Object ARCHITECTURE_LAYER,RELATIVE_ADDRESS)){
    $Index.Add("- `$($X.ABSOLUTE_ADDRESS)` | $($X.ARCHITECTURE_LAYER) | $($X.PURPOSE)")
}
$Index.Add("")
$Index.Add("## JUNK / OLD / GENERATED / RECOVERY CANDIDATES")
$Index.Add("Nothing in this section is approved for deletion.")
foreach($X in ($Rows|Where-Object JUNK_ASSESSMENT -ne "NO JUNK INDICATOR"|Sort-Object JUNK_ASSESSMENT,RELATIVE_ADDRESS)){
    $Index.Add("- [$($X.JUNK_ASSESSMENT)] `$($X.ABSOLUTE_ADDRESS)` | $($X.JUNK_EVIDENCE)")
}
$Index.Add("")
$Index.Add("## ROUTES / ENTRY POINTS")
foreach($X in ($Rows|Where-Object ROUTE_API_EVIDENCE|Sort-Object RELATIVE_ADDRESS)){
    $Index.Add("- `$($X.ABSOLUTE_ADDRESS)` → $($X.ROUTE_API_EVIDENCE)")
}
$Index.Add("")
$Index.Add("## FILE-BY-FILE CONTENT PROFILES")
foreach($X in ($Rows|Sort-Object RELATIVE_ADDRESS)){
    $Index.Add("- `$($X.ABSOLUTE_ADDRESS)` | Size=$($X.SIZE_BYTES) | Type=$($X.CONTENT_TYPE) | Group=$($X.ARCHITECTURE_LAYER) | Git=$($X.GIT_STATE) | Claude=$($X.CLAUDE_STATUS) | Purpose=$($X.PURPOSE) | $($X.CONTENT_SUMMARY)")
}
Set-Content -Encoding UTF8 "$Out\14_COMPLETE_NAVIGATION_INDEX.md" ($Index -join "`r`n")

# System flow diagram (architectural overview, while exact edges remain in CSV).
$Flow=@"
flowchart TD
ROOT["EBDESIGN ROOT"]
ROOT --> FS["COMPLETE FILESYSTEM<br/>$($Folders.Count) folders / $($Rows.Count) files"]
FS --> INV["MASTER FILE INVENTORY"]
INV --> CLAUDE["CLAUDE / ANTHROPIC / MCP"]
INV --> AI["OTHER AI"]
INV --> API["API / ROUTES"]
INV --> UI["FRONTEND / UI"]
INV --> BE["BACKEND"]
INV --> DOMAIN["DOMAIN"]
INV --> PLATFORM["PLATFORM"]
INV --> ENT["ENTERPRISE"]
INV --> ERP["ERP"]
INV --> STRATEGY["STRATEGY"]
INV --> DATA["DATA / DATABASE"]
INV --> SEC["SECURITY"]
INV --> TEST["TEST"]
INV --> DOC["DOCUMENTATION"]
INV --> BUILD["BUILD / DEVOPS"]
INV --> REC["RECOVERY CANDIDATES"]
CLAUDE --> AI
CLAUDE --> API
AI --> API
API --> BE
UI --> API
BE --> DOMAIN
DOMAIN --> PLATFORM
PLATFORM --> DATA
ENTERPRISE["ENTERPRISE"] --> DOMAIN
ERP --> DOMAIN
STRATEGY --> ERP
REC --> DOMAIN
REC --> API
REC --> UI
REC --> AI
"@
Set-Content -Encoding UTF8 "$Out\15_SYSTEM_FLOW.mmd" $Flow

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " EBDESIGN ULTRA-COMPREHENSIVE READ-ONLY AUDIT COMPLETE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "FILES ENUMERATED : $($Rows.Count)"
Write-Host "FOLDERS ENUMERATED: $($Folders.Count)"
Write-Host "SCAN ERRORS       : $($Errors.Count)"
Write-Host "CLAUDE EVIDENCE   : $(($Rows|Where-Object ClaudeEvidence).Count)"
Write-Host "OTHER AI FILES    : $(($Rows|Where-Object AI_PROVIDER_EVIDENCE).Count)"
Write-Host "ROUTE/API FILES   : $(($Rows|Where-Object ROUTE_API_EVIDENCE).Count)"
Write-Host ""
Write-Host "AUDIT DIRECTORY:" -ForegroundColor Green
Write-Host $Out
Write-Host ""
Write-Host "PRIMARY NAVIGATION INDEX:" -ForegroundColor Green
Write-Host "$Out\14_COMPLETE_NAVIGATION_INDEX.md"
Write-Host ""
Write-Host "MASTER FILE INDEX:" -ForegroundColor Green
Write-Host "$Out\01_MASTER_EVERY_FILE.csv"
Write-Host ""
Write-Host "SCAN ERRORS:" -ForegroundColor Yellow
Write-Host "$Out\05_SCAN_ERRORS.csv"
Write-Host ""
Write-Host "READ-ONLY: NO SOURCE FILES OR GIT STATE MODIFIED." -ForegroundColor Green
