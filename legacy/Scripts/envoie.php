<?php
    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    $data = $_POST['formData'];
    $command = escapeshellcmd("python3 scrappeur.py $data");
    $output= shell_exec($command);
    print ($output);
?>
