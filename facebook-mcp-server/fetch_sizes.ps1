$types = @{ 
  "adworkposition" = "nutricionista,nutritionist,nutrologo,dietitian,clinical nutritionist,sports nutritionist"; 
  "adeducationmajor" = "nutrição,nutrition,dietetics,clinical nutrition"; 
  "adinterest" = "nutrição clínica,crn,dietética,nutrição esportiva,nutrição humana,medical education,optimum nutrition,essential nutrition"; 
  "adworkemployer" = "clínica de nutrição,hospital,consultório,health clinic" 
}
$results = @()

foreach($k in $types.Keys) {
  $queries = $types[$k] -split ","
  foreach($q in $queries) {
    $url="https://graph.facebook.com/v19.0/search?type=$k&q=$([uri]::EscapeDataString($q.Trim()))&access_token=$([Environment]::GetEnvironmentVariable('META_ACCESS_TOKEN'))"
    try {
      $req = Invoke-RestMethod -Uri $url -Method Get
      if($req.data) {
        foreach($item in $req.data) {
          $results += [PSCustomObject]@{
            Type = $k
            Name = $item.name
            SizeLower = $item.audience_size_lower_bound
            SizeUpper = $item.audience_size_upper_bound
          }
        }
      }
    } catch {}
  }
}

$results | ConvertTo-Json -Depth 5 | Out-File -FilePath "C:\Users\Samsung\.gemini\antigravity\scratch\facebook-mcp-server\results.json"
