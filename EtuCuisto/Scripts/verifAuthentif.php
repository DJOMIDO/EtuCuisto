<?php
    if (isset($_POST['login']) and isset($_POST['mdp'])) {
        $login = $_POST['login'];
        $mdp = $_POST['mdp'];

        $requete = "SELECT mdp FROM utilisateurs WHERE login='$login'";
        include_once("connexion.php");
        if ($reponse=$pdo->query($requete)) {
            if ($enr = $reponse->fetch()) {
                if ($mdp == $enr['mdp']) {
                    print "Authenification réussie";
                } else {
                    print "Mot de passe erroné";
                }
            } else {
                print "Login inexistant";
            }
        } else {
            print "Requête erronée";
        }
    } else {
        print "Aucune donnée";
    }
?>