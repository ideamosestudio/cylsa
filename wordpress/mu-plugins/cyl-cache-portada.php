<?php
/**
 * Plugin Name: Caché de portada CYL
 * Description: Reutiliza la portada pública entre visitas anónimas.
 */
defined('ABSPATH') || exit;

function cyl_purge_home_cache(){
    delete_transient('cyl_public_home');
}
add_action('save_post','cyl_purge_home_cache');
add_action('switch_theme','cyl_purge_home_cache');
add_action('upgrader_process_complete','cyl_purge_home_cache');
add_action('customize_save_after','cyl_purge_home_cache');

add_action('template_redirect',function(){
    if(!is_front_page() || !is_ssl() || is_user_logged_in() || !empty($_COOKIE)
        || ($_SERVER['REQUEST_METHOD'] ?? '')!=='GET' || ($_SERVER['REQUEST_URI'] ?? '')!=='/'
        || ($_SERVER['HTTP_HOST'] ?? '')!==wp_parse_url(home_url(),PHP_URL_HOST)
        || !empty($_SERVER['HTTP_AUTHORIZATION']) || !empty($_SERVER['PHP_AUTH_USER'])
        || post_password_required() || (defined('DONOTCACHEPAGE') && DONOTCACHEPAGE)) return;

    $layout=get_template_directory().'/pages/inicio.json';
    if(!is_file($layout)) return;
    $version=filemtime($layout);
    $cached=get_transient('cyl_public_home');
    if(is_array($cached) && $cached['version']===$version){
        header($cached['policy']);
        header('X-Cache: HIT');
        header('Cache-Control: private, max-age=0, must-revalidate');
        echo $cached['html'];
        exit;
    }
    ob_start(function($html) use ($version){
        if(headers_sent() || http_response_code()!==200 || stripos($html,'</html>')===false) return $html;
        $policy='';
        foreach(headers_list() as $line){
            if(stripos($line,'Set-Cookie:')===0 || preg_match('/^Cache-Control:.*(no-store|private)/i',$line)) return $html;
            if(stripos($line,'Content-Security-Policy:')===0) $policy=$line;
        }
        if($policy!==''){
            set_transient('cyl_public_home',array('version'=>$version,'html'=>$html,'policy'=>$policy),5*MINUTE_IN_SECONDS);
            header('X-Cache: MISS');
            header('Cache-Control: private, max-age=0, must-revalidate');
        }
        return $html;
    });
},9);
