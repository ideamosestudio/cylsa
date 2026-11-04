<?php
/*
Plugin Name: Encuestas CYL
Description: Encuesta de satisfacción y bandeja privada de respuestas.
Version: 1.0.0
*/
defined('ABSPATH') || exit;
function cyl_enc_table(){global $wpdb;return $wpdb->prefix.'cyl_encuestas';}
function cyl_enc_schema(){return json_decode(file_get_contents(__DIR__.'/cyl-encuestas/survey.json'),true);}
add_action('init',function(){
    if(get_option('cyl_enc_schema')==='1')return;
    global $wpdb;
    require_once ABSPATH.'wp-admin/includes/upgrade.php';
    $table=cyl_enc_table();
    dbDelta("CREATE TABLE $table (
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      ticket char(36) NOT NULL,
      fecha datetime NOT NULL,
      respuestas longtext NOT NULL,
      PRIMARY KEY  (id),
      UNIQUE KEY ticket (ticket)
    ) ".$wpdb->get_charset_collate().";");
    if($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s',$wpdb->esc_like($table)))===$table)update_option('cyl_enc_schema','1');
});
add_filter('render_block',function($html){
    if(!is_page('encuesta-de-satisfaccion') || !str_contains($html,'data-survey-form'))return $html;
    if(!is_ssl())return '<p>Para completar la encuesta, <a href="'.esc_url(set_url_scheme(get_permalink(),'https')).'">abrí la página segura</a>.</p>';
    // Replace only the compiled preview controller; the other page modules remain unchanged.
    $html=preg_replace_callback('~<script\b[^>]*>(.*?)</script>~is',function($m){return str_contains($m[1],'data-survey-form')?'':$m[0];},$html);
    $html=str_replace('Vista previa · Podés recorrer la encuesta, pero las respuestas todavía no se envían ni se guardan.','CYL guardará tus respuestas al finalizar la encuesta para evaluar y mejorar la atención.',$html);
    $html=preg_replace('~<form\b[^>]*data-survey-form[^>]*>~i','<form method="post" data-survey-form novalidate data-endpoint="'.esc_url(admin_url('admin-ajax.php','https')).'" data-token="'.esc_attr(wp_create_nonce('cyl_enc_submit')).'">',$html,1);
    $html=str_replace(array('Recorrido completado','Terminaste la vista previa de la encuesta. Tus respuestas no se enviaron ni se guardaron.','Activá JavaScript para recorrer los cuatro pasos de esta vista previa. No se enviará ningún dato.'),array('Respuesta recibida','Gracias por contarnos tu experiencia. Tu respuesta quedó guardada.','Activá JavaScript para completar la encuesta.'),$html);
    return $html.'<script type="module" src="'.esc_url(plugins_url('cyl-encuestas/form.js',__FILE__)).'?v=2"></script>';
});
function cyl_enc_error($msg,$code){wp_send_json_error(array('message'=>$msg),$code);}
function cyl_enc_submit(){
    if(!is_ssl() || $_SERVER['REQUEST_METHOD']!=='POST')cyl_enc_error('Usá la página segura de la encuesta.',403);
    if(!check_ajax_referer('cyl_enc_submit','token',false))cyl_enc_error('La sesión venció. Recargá la encuesta.',403);
    $ticket=sanitize_text_field(wp_unslash($_POST['ticket']??''));
    if(!wp_is_uuid($ticket,4))cyl_enc_error('Envío inválido.',400);
    $data=array();
    foreach(cyl_enc_schema()['steps'] as $step)foreach($step['fields'] as $field){
        $v=$_POST[$field['name']]??'';
        if(!is_string($v))cyl_enc_error('Respuesta inválida.',422);
        $v=trim(wp_unslash($v));$type=$field['type'];
        if($type==='textarea')$v=sanitize_textarea_field($v);else $v=sanitize_text_field($v);
        $max=$type==='textarea'?3000:($type==='email'?254:160);
        if(($field['required'] && $v==='') || mb_strlen($v)>$max || ($v!=='' && (($type==='email' && !is_email($v)) || (isset($field['options']) && !in_array($v,array_column($field['options'],'value'),true)))))cyl_enc_error('Revisá el campo: '.$field['label'],422);
        $data[$field['name']]=$v;
    }
    global $wpdb;$table=cyl_enc_table();
    if($wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE ticket=%s",$ticket)))wp_send_json_success();
    $key='cyl_enc_'.substr(hash_hmac('sha256',$_SERVER['REMOTE_ADDR']??'',wp_salt()),0,32);
    $count=(int)get_transient($key);if($count>=25)cyl_enc_error('Hubo muchos envíos. Intentá más tarde.',429);
    if(!$wpdb->insert($table,array('fecha'=>current_time('mysql'),'ticket'=>$ticket,'respuestas'=>wp_json_encode($data,JSON_UNESCAPED_UNICODE)))){
        if(!$wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE ticket=%s",$ticket)))cyl_enc_error('No pudimos guardar tu respuesta. Intentá de nuevo.',503);
    }else set_transient($key,$count+1,HOUR_IN_SECONDS);
    wp_send_json_success();
}
add_action('wp_ajax_cyl_enc_submit','cyl_enc_submit');
add_action('wp_ajax_nopriv_cyl_enc_submit','cyl_enc_submit');
add_action('admin_post_cyl_enc_delete',function(){
    if(!current_user_can('manage_options') || !is_ssl() || $_SERVER['REQUEST_METHOD']!=='POST')wp_die('Acceso denegado.');
    $id=absint($_POST['id']??0);check_admin_referer('cyl_enc_delete_'.$id);
    if(($_POST['confirmar']??'')!=='si')wp_die('Confirmá la eliminación antes de continuar.');
    global $wpdb;$wpdb->delete(cyl_enc_table(),array('id'=>$id),array('%d'));
    wp_safe_redirect(admin_url('admin.php?page=cyl-encuestas'));exit;
});
add_action('admin_menu',function(){add_menu_page('Encuestas CYL','Encuestas CYL','manage_options','cyl-encuestas','cyl_enc_admin','dashicons-feedback',26);});
function cyl_enc_admin(){
    if(!current_user_can('manage_options') || !is_ssl())wp_die('Se requiere acceso administrativo por HTTPS.');
    global $wpdb;$table=cyl_enc_table();$url=admin_url('admin.php?page=cyl-encuestas');
    echo '<div class="wrap"><h1>Encuestas CYL</h1>';
    $id=absint($_GET['respuesta']??0);
    if($id){
        $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id=%d",$id));
        echo '<p><a href="'.esc_url($url).'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><path d="M20 12H5m6-6-6 6 6 6"/></svg> Volver a las respuestas</a></p>';
        if(!$row){echo '<p>Respuesta no encontrada.</p></div>';return;}
        $data=json_decode($row->respuestas,true);
        echo '<h2>Respuesta #'.intval($id).'</h2><p>'.esc_html($row->fecha).'</p>';
        foreach(cyl_enc_schema()['steps'] as $step){
            echo '<h3>'.esc_html($step['title']).'</h3><dl>';
            foreach($step['fields'] as $f){$v=$data[$f['name']]??'';
                if(isset($f['options']))foreach($f['options'] as $o)if($o['value']===$v){$v=$o['label'];break;}
                echo '<dt><strong>'.esc_html($f['label']).'</strong></dt><dd>'.nl2br(esc_html($v!==''?$v:'Sin respuesta')).'</dd>';
            }echo '</dl>';
        }
        echo '<form method="post" action="'.esc_url(admin_url('admin-post.php')).'"><input type="hidden" name="action" value="cyl_enc_delete"><input type="hidden" name="id" value="'.intval($id).'">';
        wp_nonce_field('cyl_enc_delete_'.$id);
        echo '<label><input type="checkbox" required name="confirmar" value="si"> Confirmo que quiero eliminar esta respuesta.</label> <button class="button">Eliminar respuesta</button></form>';
    }else{
        $total=(int)$wpdb->get_var("SELECT COUNT(*) FROM $table");$pages=max(1,(int)ceil($total/25));$p=min($pages,max(1,absint($_GET['paged']??1)));
        echo '<p>Respuestas recibidas: <strong>'.intval($total).'</strong></p><table class="widefat striped"><thead><tr><th>Fecha</th><th>Persona</th><th>Empresa</th><th>Satisfacción</th><th>Detalle</th></tr></thead><tbody>';
        foreach($wpdb->get_results($wpdb->prepare("SELECT * FROM $table ORDER BY id DESC LIMIT 25 OFFSET %d",($p-1)*25)) as $r){
            $d=json_decode($r->respuestas,true);
            echo '<tr><td>'.esc_html($r->fecha).'</td><td>'.esc_html($d['first_name'].' '.$d['last_name']).'</td><td>'.esc_html($d['company']).'</td><td>'.esc_html($d['service_satisfaction']).' / 5</td><td><a href="'.esc_url(add_query_arg('respuesta',$r->id,$url)).'">Ver respuesta</a></td></tr>';
        }
        if(!$total)echo '<tr><td colspan="5">Todavía no se recibieron respuestas.</td></tr>';
        echo '</tbody></table>'.wp_kses_post(paginate_links(array('base'=>add_query_arg('paged','%#%',$url),'format'=>'','current'=>$p,'total'=>$pages)));
    }echo '</div>';
}
