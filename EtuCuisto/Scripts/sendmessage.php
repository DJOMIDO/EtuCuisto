<?php
require_once "connexion.php";

if (isset($_POST["newusrname"]) && isset($_POST["newusrmail"]) && isset($_POST["newusrmesg"])) {
    $username = $_POST["newusrname"];
    $mail = $_POST["newusrmail"];
    $messages = $_POST["newusrmesg"];
}
$stmt = $pdo->prepare("INSERT INTO user_messages (nom, email, msg) VALUES (:uname, :umail, :umsg)");
$stmt->bindParam(":uname", $username);
$stmt->bindParam(":umail", $mail);
$stmt->bindParam(":umsg", $messages);

if ($stmt->execute()) {
    echo "<script type='text/javascript'>alert('Votre message a été envoyé avec succès et nous vous répondrons dans les meilleurs délais.');</script>";
} else {
    echo "<script type='text/javascript'>alert('Oups, un problème est survenu, veuillez réessayer plus tard.');</script>";
}
?>