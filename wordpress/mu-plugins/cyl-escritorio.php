<?php
/**
 * Plugin Name: Escritorio de CYL
 * Description: Accesos de gestión para el equipo de CYL.
 */
defined('ABSPATH') || exit;

add_action('init',function(){
    if(!get_role('cyl_consulta')) add_role('cyl_consulta','Consulta de encuestas',array('read'=>true,'cyl_ver_encuestas'=>true));
});

function cyl_panel_simple(){
    if(current_user_can('manage_options')) return !get_user_meta(get_current_user_id(),'cyl_panel_completo',true);
    return current_user_can('cyl_ver_encuestas');
}

add_action('load-index.php',function(){
    if(cyl_panel_simple()){
        wp_safe_redirect(admin_url('admin.php?page=cyl-encuestas'));
        exit;
    }
});

add_action('admin_menu',function(){
    if(!cyl_panel_simple()) return;
    global $menu;
    foreach($menu as $item){
        if(!in_array($item[2],array('cyl-encuestas','profile.php'),true)) remove_menu_page($item[2]);
    }
},999);

add_action('admin_bar_menu',function($bar){
    if(!is_admin()) return;
    if(cyl_panel_simple()){
        foreach(array('new-content','comments','wp-logo','updates') as $node) $bar->remove_node($node);
    }
    if(current_user_can('manage_options')){
        $mode=cyl_panel_simple()?'completo':'encuestas';
        $bar->add_node(array('id'=>'cyl-panel','title'=>$mode==='completo'?'Administración completa':'Panel de encuestas','href'=>wp_nonce_url(admin_url('admin-post.php?action=cyl_panel&modo='.$mode),'cyl_panel')));
    }
},999);

add_action('admin_post_cyl_panel',function(){
    if(!current_user_can('manage_options')) wp_die('Acceso denegado.');
    check_admin_referer('cyl_panel');
    $full=($_GET['modo'] ?? '')==='completo';
    update_user_meta(get_current_user_id(),'cyl_panel_completo',$full?'1':'');
    wp_safe_redirect($full?admin_url():admin_url('admin.php?page=cyl-encuestas'));
    exit;
});

add_action('wp_dashboard_setup',function(){
    if(!current_user_can('manage_options')) return;
    remove_meta_box('dashboard_primary','dashboard','side');
    remove_meta_box('dashboard_quick_press','dashboard','side');
    wp_add_dashboard_widget('cyl_gestion','Gestión de CYL',function(){
        echo '<p><a class="button button-primary" href="'.esc_url(admin_url('admin.php?page=cyl-encuestas')).'">Ver respuestas de encuestas</a></p>';
        echo '<p><a href="'.esc_url(admin_url('edit.php?post_type=page')).'">Administrar páginas del sitio</a></p>';
    },null,null,'normal','high');
});
