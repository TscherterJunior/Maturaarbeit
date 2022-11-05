<?php

header("Content-Type: application/json");
$method = $_SERVER['REQUEST_METHOD'];

if($method == 'GET') {
    if (isset($_GET['id'])) { // Testet ob die Anfrage Spezifisch ist oder nicht
        $id = $_GET['id'];
        $id = preg_replace('/[^a-z0-9]/', '', $id ); // Sanitize id
        echo file_get_contents("./trails/$id.json"); // JSON datei zurück schicken
    } else {
        $list = [];
        $ids = scandir("./trails/"); //trails ordner scannen
        foreach($ids as $id) {
            if ($id[0]=='.') continue;
            $id = explode('.', $id);
            $id = $id[0];
            $list[] = $id;
            // liste komposieren
        } 
        echo json_encode($list); // liste zurück schicken
    }
}