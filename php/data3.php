<?php

require_once('conexion.php');

$db = new connectdb();

$post = $_POST;

$_pDisplayStart = $post['pDisplayStart'];
$_pDisplayLength = $post['pDisplayLength'];
$_pOrder = isset($post['pOrder']) ? $post['pOrder'] : '';
$_sFilterCols = isset($post['sFilterCols']) ? $post['sFilterCols'] : '';
$_sExport = isset($post['sExport']) ? $post['sExport'] : '0';
$_encuestaactividad = isset($post['_encuestaactividad']) ? $post['_encuestaactividad'] : '';


//$_sFilterCols = htmlspecialchars($_sFilterCols, ENT_QUOTES);

$query = "call sp_listaPersona("
        . "'" . $_pDisplayStart . "',"
        . "'" . $_pDisplayLength . "',"
        . "'" . $_pOrder . "',"
        . "'" . $_sFilterCols . "',"
        . "'" . $_sExport . "'"
    . ")";

$result = $db->query($query);


echo json_encode($result);

