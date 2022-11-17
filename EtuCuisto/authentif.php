<!DOCTYPE html>

<body>
    <h2>Authentification</h2>
    Login<input type="text" id="login"/><br/>
    Mot de passe<input type="password" id="mdp"/><br/>
    <button id="ok">Se connecter</button>
    <div id="rep"></div>
    <script>
        $("#ok").on("click",function(){
            // récupération du login et du mdp saisis dans le formulaire
            let login = $("#login").val();
            let mdp = $("#mdp").val();
            // requête ajax pour interrogation de la BD
            $.ajax({
                method : 'post',
                url : 'verifAuthentif.php',
                dataType :'html',
                data : {'login':$("#login").val(),'mdp':$("#mdp").val()},
                success : function(reponse, status) {
                    $("#rep").val(reponse);
                }
            })
        })
    </script>
</body>

</html>