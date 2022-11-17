<?php
require_once "connexion.php";

if (isset($_POST["newusername"]) && isset($_POST["newpassword"])) {
    $username = $_POST["newusername"];
    $password = $_POST["newpassword"];
}
$stmt = $pdo->prepare("INSERT INTO utilisateurs (login, mdp) VALUES (:uname, :upasswd)");
$stmt->bindParam(":uname", $username);
$stmt->bindParam(":upasswd", $password);

if ($stmt->execute()) {
    echo "<script type='text/javascript'>alert('Félicitation, vous pouvez vous connecter maintenant !');</script>";
} else {
    echo "<script type='text/javascript'>alert('Désolé, impossible de vous inscrire !');</script>";
}
?>