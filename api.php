<?php

header("Content-Type: application/json");
$method = $_SERVER['REQUEST_METHOD'];

if($method == 'GET') {
    if (isset($_GET['id'])) {
        $id = $_GET['id'];
        $id = preg_replace('/[^a-z0-9]/', '', $id );
        //$raw = file_get_contents("./trails/$id.json");
        //$obj = json_decode($raw, true);
        //echo json_encode($obj, JSON_PRETTY_PRINT);
        echo file_get_contents("./trails/$id.json");
    } else {
        $list = [];
        $ids = scandir("./trails/");
        foreach($ids as $id) {
            if ($id[0]=='.') continue;
            $id = explode('.', $id);
            $id = $id[0];
            $list[] = $id;
        }
        echo json_encode($list);
    }
}