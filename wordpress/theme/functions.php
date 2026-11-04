<?php
defined('ABSPATH') || exit;
add_action('after_setup_theme', function () {
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form','gallery','caption','style','script'));
});
remove_action('wp_head','rel_canonical');
remove_action('wp_head','wp_generator');
remove_action('wp_head','wp_shortlink_wp_head');
// The imported pages use the theme's HTML and CSS. Keep WordPress block
// assets when an editor introduces any native block, or for a signed-in user.
add_action('wp_enqueue_scripts', function () {
    if (is_user_logged_in() || !is_singular()) return;
    $id=get_queried_object_id();
    if (!get_post_meta($id,'_cyl_layout',true)) return;
    $blocks=parse_blocks(get_post_field('post_content',$id));
    foreach ($blocks as $block) {
        if (!in_array($block['blockName'],array(null,'core/html'),true)) return;
    }
    foreach (array('wp-block-library','classic-theme-styles','global-styles','wp-emoji-styles') as $handle) {
        wp_dequeue_style($handle);
    }
    remove_action('wp_head','print_emoji_detection_script',7);
    remove_action('wp_head','wp_enqueue_emoji_styles',1);
    remove_action('wp_footer','wp_enqueue_global_styles',1);
},PHP_INT_MAX);
// Hash the complete rendered document, including WordPress/plugin inline scripts.
// This keeps the script policy strict without blocking normal WP integrations.
add_action('template_redirect', function () {
    if (is_feed() || is_robots() || is_trackback()) return;
    ob_start(function ($html) {
        if (headers_sent() || stripos($html, '<html') === false) return $html;
        preg_match_all('~<script\b[^>]*>(.*?)</script\s*>~is', $html, $matches);
        $hashes=array();
        foreach ($matches[1] as $script) $hashes[]="'sha256-".base64_encode(hash('sha256',$script,true))."'";
        header("Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' ".implode(' ',array_unique($hashes))."; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://secure.gravatar.com; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'; frame-src 'none'");
        return $html;
    });
});
function cyl_page_data($slug) {
    if (!preg_match('/^[a-z0-9-]+$/',$slug)) return null;
    $file = get_template_directory() . '/pages/' . $slug . '.json';
    return is_file($file) ? json_decode(file_get_contents($file),true) : null;
}
add_action('admin_menu', function () {
    add_theme_page('Preparar sitio CYL','Preparar sitio CYL','manage_options','cyl-setup',function () {
        if (!current_user_can('manage_options')) return;
        echo '<div class="wrap"><h1>Preparar sitio CYL</h1><p>Crea páginas nuevas y actualiza el diseño de las páginas que siguen iguales a la edición anterior. Conserva el contenido editado en WordPress.</p>';
        echo '<form method="post" action="'.esc_url(admin_url('admin-post.php')).'"><input type="hidden" name="action" value="cyl_import">';
        wp_nonce_field('cyl_import'); submit_button('Crear páginas CYL'); echo '</form></div>';
    });
});
add_action('admin_post_cyl_import', function () {
    if (!current_user_can('manage_options')) wp_die('Acceso denegado','',array('response'=>403));
    check_admin_referer('cyl_import');
    // Remove only the known WordPress starter content; keep it recoverable.
    foreach (array(array('sample-page','page','Sample Page'),array('hello-world','post','Hello world!')) as $sample) {
        $post=get_page_by_path($sample[0],OBJECT,$sample[1]);
        if ($post && $post->post_title===$sample[2]) wp_trash_post($post->ID);
    }
    $pages=json_decode(file_get_contents(get_template_directory().'/manifest.json'),true);
    foreach ($pages as $page) {
        $existing=get_page_by_path($page['slug']);
        if ($existing) {
            $id=$existing->ID;
            static $prior=null;
            if ($prior===null) {
                $file=get_template_directory().'/previous-content.json';
                $prior=is_file($file)?json_decode(file_get_contents($file),true):array();
            }
            if (get_post_meta($id,'_cyl_layout',true)===$page['slug'] && isset($prior[$page['slug']]) && hash_equals($prior[$page['slug']],hash('sha256',$existing->post_content))) {
                $updated='<!-- wp:html -->'.cyl_page_data($page['slug'])['content'].'<!-- /wp:html -->';
                if ($updated!==$existing->post_content) {
                    $result=wp_update_post(wp_slash(array('ID'=>$id,'post_content'=>$updated)),true);
                    if(is_wp_error($result))wp_die(esc_html($result->get_error_message()));
                }
            }
        }
        else {
            $data=cyl_page_data($page['slug']);
            $id=wp_insert_post(wp_slash(array('post_type'=>'page','post_status'=>'publish','post_name'=>$page['slug'],'post_title'=>$page['title'],'post_content'=>'<!-- wp:html -->'.$data['content'].'<!-- /wp:html -->','comment_status'=>'closed','ping_status'=>'closed')),true);
            if (is_wp_error($id)) wp_die(esc_html($id->get_error_message()));
            update_post_meta($id,'_cyl_layout',$page['slug']);
        }
        if ($page['slug']==='inicio') {update_option('show_on_front','page');update_option('page_on_front',$id);}
    }
    global $wp_rewrite;
    update_option('WPLANG','es_AR');
    update_option('timezone_string','America/Argentina/Buenos_Aires');
    $wp_rewrite->set_permalink_structure('/%postname%/');
    flush_rewrite_rules();
    wp_safe_redirect(admin_url('edit.php?post_type=page'));exit;
});
