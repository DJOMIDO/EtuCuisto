<?php
try {
    /* connexion à la base */
    $pdo = new PDO('mysql:host=localhost;dbname=maxiao','maxiao','&maxiao;');
    //$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // print "La base est ouverte ! <br/>\n";
}
catch (Exception $e) {
    die('Erreur : '.$e->getMessage());
    print "Accès impossible à la base ! <br/>\n";
}
?>