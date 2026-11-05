<?php
/**
 * Plugin Name: Escritorio de CYL
 * Description: Accesos de gestión para el equipo de CYL.
 */
defined('ABSPATH') || exit;

add_action('wp_dashboard_setup',function(){
    if(!current_user_can('manage_options')) return;
    remove_meta_box('dashboard_primary','dashboard','side');
    remove_meta_box('dashboard_quick_press','dashboard','side');
    wp_add_dashboard_widget('cyl_gestion','Gestión de CYL',function(){
        echo '<p><a class="button button-primary" href="'.esc_url(admin_url('admin.php?page=cyl-encuestas')).'">Ver respuestas de encuestas</a></p>';
        echo '<p><a href="'.esc_url(admin_url('edit.php?post_type=page')).'">Administrar páginas del sitio</a></p>';
    },null,null,'normal','high');
});
