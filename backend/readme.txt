Navigate to Backend Folder.
1) cd Backend
// To run go app and watch 
2) CompileDaemon -command="./Backend"

//To migrate 
3) go run ./migrations/migrate.go


// to remove zone.identifier
cd 'c:\Users\Admin\Downloads\erp'; Get-ChildItem -Path . -Recurse -Filter '*Zone.Identifier*' -File -Force | Remove-Item -Force -ErrorAction SilentlyContinue; Write-Output 'REMOVE_DONE'
REMOVE_DONE