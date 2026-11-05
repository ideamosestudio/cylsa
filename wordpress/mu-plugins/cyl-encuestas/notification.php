<?php
defined('ABSPATH') || exit;

/** Includes every answer in the message; no public files containing personal data. */
function cyl_enc_notice_content($row){
    $data=json_decode($row->respuestas,true) ?: array();
    $person=trim(($data['first_name'] ?? '').' '.($data['last_name'] ?? ''));
    $score=$data['service_satisfaction'] ?? '';
    $score=in_array((string)$score,array('1','2','3','4','5'),true)?$score.' / 5':'Sin respuesta';
    $date=mysql2date('d/m/Y · H:i',$row->fecha);
    $link=admin_url('admin.php?page=cyl-encuestas&respuesta='.(int)$row->id,'https');
    $plain="Nueva encuesta de satisfacción #{$row->id}\n{$person}\n{$date} (hora de Argentina)\nSatisfacción: {$score}\n";
    $sections='';
    foreach(cyl_enc_schema()['steps'] as $step){
        $sections.='<tr><td style="padding:28px 28px 8px;font:700 18px/1.4 Arial,sans-serif;color:#15151a">'.esc_html($step['title']).'</td></tr>';
        $plain.="\n".$step['title']."\n";
        foreach($step['fields'] as $field){
            $value=(string)($data[$field['name']] ?? '');
            $label=$value;
            foreach($field['options'] ?? array() as $option){
                if((string)$option['value']===$value){$label=$option['label'];break;}
            }
            if($field['type']==='rating' && $value!=='')$label=$value.' / 5'.($label!==$value?' · '.$label:'');
            if($value==='')$label='Sin respuesta';
            $sections.='<tr><td style="padding:12px 28px;border-bottom:1px solid #ececef;word-break:break-word"><p style="margin:0 0 6px;font:400 13px/1.5 Arial,sans-serif;color:#666670">'.esc_html($field['label']).'</p><p style="margin:0;font:600 16px/1.6 Arial,sans-serif;color:#202026">'.nl2br(esc_html($label)).'</p></td></tr>';
            $plain.=$field['label'].': '.$label."\n";
        }
    }
    $plain.="\nVer respuesta en el panel (requiere iniciar sesión): {$link}\nAviso automático de CYL Neumáticos.";
    $html='<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nueva encuesta CYL</title></head><body style="margin:0;padding:0;background:#eeeef1"><div style="display:none;max-height:0;overflow:hidden">Una nueva opinión para seguir mejorando la atención de CYL.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eeeef1"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fff;border-radius:16px;overflow:hidden">'
        .'<tr><td style="padding:30px 28px;background:#101014;border-top:5px solid #da1231;color:#fff"><p style="margin:0 0 22px;font:700 16px Arial,sans-serif;letter-spacing:2px">CYL <span style="color:#bebec6;font-weight:400;letter-spacing:0">NEUMÁTICOS</span></p><p style="margin:0 0 10px;color:#ff8c9d;font:600 12px Arial,sans-serif;letter-spacing:1px">ESCUCHAMOS PARA MEJORAR</p><h1 style="margin:0;font:700 30px/1.2 Arial,sans-serif">Llegó una nueva opinión.</h1><p style="margin:14px 0 0;color:#d8d8de;font:400 15px/1.6 Arial,sans-serif">'.esc_html($person ?: 'Un cliente').' completó la encuesta de satisfacción.</p></td></tr>'
        .'<tr><td style="padding:24px 28px;background:#faf2f4"><p style="margin:0 0 8px;color:#62626b;font:400 13px Arial,sans-serif">SATISFACCIÓN CON EL SERVICIO</p><p style="margin:0;color:#a60c26;font:700 32px Arial,sans-serif">'.esc_html($score).'</p><p style="margin:12px 0 0;color:#62626b;font:400 13px/1.5 Arial,sans-serif">Respuesta #'.(int)$row->id.' · '.esc_html($date).' (Argentina)</p></td></tr>'
        .'<tr><td style="padding:26px 28px 0"><a href="'.esc_url($link).'" style="display:inline-block;background:#bd102b;color:#fff;text-decoration:none;padding:15px 22px;border-radius:6px;font:700 15px Arial,sans-serif">Ver respuesta en el panel</a><p style="margin:12px 0 0;color:#73737c;font:400 12px/1.5 Arial,sans-serif">Ingresá con tu cuenta de CYL. También podés leer todas las respuestas a continuación.</p></td></tr>'
        .$sections.'<tr><td style="padding:26px 28px;background:#fafafa;color:#73737c;font:400 12px/1.6 Arial,sans-serif">CYL Neumáticos · Confianza en cada kilómetro.<br>Aviso automático para el equipo de CYL. Contiene información de un cliente; compartila solo con quienes gestionan su atención.</td></tr></table></td></tr></table></body></html>';
    return array('html'=>$html,'plain'=>$plain);
}

function cyl_enc_queue_notice($id){
    add_option('cyl_enc_mail_'.$id,array('status'=>'pending','attempts'=>0),'',false);
    // Keep a fallback scheduled before the immediate attempt, without delaying the form on cron.
    wp_schedule_single_event(time()+5*MINUTE_IN_SECONDS,'cyl_enc_send_notice',array($id));
    cyl_enc_send_notice($id);
}
add_action('cyl_enc_send_notice','cyl_enc_send_notice');
function cyl_enc_send_notice($id){
    $id=absint($id);$key='cyl_enc_mail_'.$id;$state=get_option($key);
    if(!$state || $state['status']==='sent' || $state['attempts']>=3)return;
    $lock=$key.'_lock';
    if((int)get_option($lock,PHP_INT_MAX)<time()-300)delete_option($lock);
    if(!add_option($lock,time(),'',false))return;
    try{
        global $wpdb;
        $row=$wpdb->get_row($wpdb->prepare('SELECT * FROM '.cyl_enc_table().' WHERE id=%d',$id));
        if(!$row){delete_option($key);wp_clear_scheduled_hook('cyl_enc_send_notice',array($id));return;}
        $state['attempts']++;
        update_option($key,$state,false);
        $content=cyl_enc_notice_content($row);
        $alternate=function($mailer) use ($content){$mailer->AltBody=$content['plain'];};
        add_action('phpmailer_init',$alternate);
        try{
            $sent=wp_mail('hola@cylneumaticos.com.ar','CYL · Nueva encuesta de satisfacción #'.$id,$content['html'],array('Content-Type: text/html; charset=UTF-8'));
        }catch(Throwable $error){$sent=false;}
        finally{remove_action('phpmailer_init',$alternate);}
        $state['status']=$sent?'sent':'failed';
        update_option($key,$state,false);
        wp_clear_scheduled_hook('cyl_enc_send_notice',array($id));
        if(!$sent && $state['attempts']<3)wp_schedule_single_event(time()+5*MINUTE_IN_SECONDS,'cyl_enc_send_notice',array($id));
    }catch(Throwable $error){
        $state['status']='failed';update_option($key,$state,false);
        if($state['attempts']<3 && !wp_next_scheduled('cyl_enc_send_notice',array($id)))wp_schedule_single_event(time()+5*MINUTE_IN_SECONDS,'cyl_enc_send_notice',array($id));
    }finally{delete_option($lock);}
}
