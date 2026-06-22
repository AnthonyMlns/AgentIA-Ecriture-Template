$msg = "Reprends le projet Chroniques de Thalmoor deja initialise dans projets/romans/Chroniques-de-Thalmoor/ avec sa bible existante. Skills actifs : ecriture-romanesque, voix-neutre. 20 unites cible. Passe directement aux contraintes pre-flight puis lance l ecriture chapitre par chapitre en respectant le pipeline standard. Chemin absolu : projets/romans/Chroniques-de-Thalmoor/"

$opencode = "C:\Users\milan\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe"
& $opencode run --agent orchestrateur-roman --format json $msg
