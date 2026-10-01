Write-Host "Generando pokeApi_entrega.zip (sin node_modules)..."
if (Test-Path "pokeApi_entrega.zip") {
    Remove-Item "pokeApi_entrega.zip" -Force
}
tar.exe -a -c -f pokeApi_entrega.zip --exclude="node_modules" --exclude=".expo" --exclude=".git" --exclude="__pycache__" --exclude=".venv" --exclude="pokeApi_entrega.zip" assets scripts src services app.json package.json README.md tsconfig.json .gitignore
Write-Host "Archivo pokeApi_entrega.zip generado con exito!"
