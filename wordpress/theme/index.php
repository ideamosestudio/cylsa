<?php
defined('ABSPATH') || exit;
$slug=is_404()?'404':get_post_meta(get_queried_object_id(),'_cyl_layout',true);
$data=cyl_page_data($slug?:'inicio');
if (!$data) $data=cyl_page_data('404');
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head><?php echo $data['head']; wp_head(); ?></head>
<body <?php body_class($data['bodyClass'] ?? ''); ?>>
<?php wp_body_open(); echo $data['before'];
if (!is_404() && is_singular() && get_post_meta(get_queried_object_id(),'_cyl_layout',true)) {
    while (have_posts()) {the_post();echo do_blocks(get_the_content());}
} else {echo $data['content'];}
echo $data['after'];wp_footer();
?></body></html>
