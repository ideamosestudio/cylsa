<?php
/*
Plugin Name: Contacto CYL
Description: Entrega los mensajes de contacto desde el hosting de CYL.
Version: 1.0.0
*/
defined('ABSPATH') || exit;

function cyl_contact_error($message, $status) {
    wp_send_json_error(array('message'=>$message), $status);
}
function cyl_contact_request() {
    $origins = array('https://www.cylneumaticos.com.ar','https://cylneumaticos.com.ar','https://ideamosestudio.github.io');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!is_ssl() || ($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || !in_array($origin, $origins, true)) {
        cyl_contact_error('Abrí el formulario desde el sitio de CYL.', 403);
    }
    header('Access-Control-Allow-Origin: '.$origin);
    header('Vary: Origin', false);
    nocache_headers();
    if (($_POST['action'] ?? '') === 'cyl_contact_token') {
        wp_send_json_success(array('token'=>wp_create_nonce('cyl_contact_send')));
    }
    if (!check_ajax_referer('cyl_contact_send','token',false) || !empty($_POST['website'])) {
        cyl_contact_error('Actualizá la página y volvé a intentar.',403);
    }
    $data=array();
    foreach (array('nombre'=>160,'telefono'=>40,'email'=>160,'mensaje'=>2000,'sucursal'=>16,'vehiculo'=>32) as $key=>$limit) {
        $raw=$_POST[$key] ?? '';
        if (!is_string($raw) || mb_strlen($raw)>$limit) cyl_contact_error('Revisá los campos del formulario.',422);
        $raw=wp_unslash($raw);
        if ($key==='email' && preg_match('/[\r\n]/',$raw)) cyl_contact_error('Revisá tu email.',422);
        $data[$key]=$key==='mensaje'?sanitize_textarea_field($raw):sanitize_text_field($raw);
    }
    $branches=array('perticone'=>'Neuquén / Perticone','pin'=>'Neuquén / Pin Oeste','anelo'=>'Añelo');
    if (!$data['nombre'] || !$data['mensaje'] || !preg_match('/^[+()\d .-]{5,40}$/',$data['telefono'])
        || ($data['email']!=='' && !is_email($data['email'])) || !isset($branches[$data['sucursal']])
        || !in_array($data['vehiculo'],array('','Automóvil','Camioneta','Transporte','Agro / Vial'),true)) {
        cyl_contact_error('Revisá tu nombre, teléfono, sucursal y consulta.',422);
    }
    $rate='cyl_contact_'.substr(hash_hmac('sha256',$_SERVER['REMOTE_ADDR']??'',wp_salt()),0,32);
    $count=(int)get_transient($rate);
    if ($count>=5) cyl_contact_error('Ya recibimos varias consultas. Intentá más tarde.',429);
    set_transient($rate,$count+1,15*MINUTE_IN_SECONDS);
    $body="Nombre: {$data['nombre']}\nTeléfono: {$data['telefono']}\nEmail: {$data['email']}\nSucursal: ".$branches[$data['sucursal']]."\nVehículo: {$data['vehiculo']}\n\nConsulta:\n{$data['mensaje']}";
    $headers=array('Content-Type: text/plain; charset=UTF-8');
    if ($data['email']!=='') $headers[]='Reply-To: '.$data['email'];
    if (!wp_mail('hola@cylneumaticos.com.ar','Consulta desde la web de CYL',$body,$headers)) {
        cyl_contact_error('El servidor no pudo enviar la consulta. Intentá nuevamente.',503);
    }
    wp_send_json_success();
}
foreach (array('cyl_contact_token','cyl_contact_send') as $action) {
    add_action('wp_ajax_'.$action,'cyl_contact_request');
    add_action('wp_ajax_nopriv_'.$action,'cyl_contact_request');
}
