<?php defined('ABSPATH') || exit; ?>
<div class="wrap cyl-record cyl-inbox">
    <header class="cyl-record__cover">
        <div><p class="cyl-record__eyebrow">CYL Neumáticos</p><h1>Encuestas de satisfacción</h1></div>
        <div class="cyl-record__score"><span>Respuestas recibidas</span><strong><?php echo esc_html(number_format_i18n($total)); ?></strong></div>
    </header>
    <section class="cyl-record__section">
        <h2>Últimas respuestas</h2>
        <?php if(!$rows): ?><p>Todavía no se recibieron respuestas.</p>
        <?php else: ?>
        <ul class="cyl-inbox__rows">
        <?php foreach($rows as $row):
            $answer=json_decode($row->respuestas,true) ?: array();
            $name=trim(($answer['first_name'] ?? '').' '.($answer['last_name'] ?? ''));
            $score=(string)($answer['service_satisfaction'] ?? '');
        ?>
            <li>
                <div><strong><?php echo esc_html($name ?: 'Sin nombre'); ?></strong><span><?php echo esc_html($answer['company'] ?? ''); ?></span></div>
                <div><small>Recibida</small><span><?php echo esc_html(mysql2date('d/m/Y · H:i',$row->fecha)); ?></span></div>
                <div><small>Satisfacción</small><b><?php echo esc_html(in_array($score,array('1','2','3','4','5'),true)?$score.' / 5':'Sin respuesta'); ?></b></div>
                <a aria-label="<?php echo esc_attr('Ver respuesta de '.$name); ?>" href="<?php echo esc_url(add_query_arg(array('respuesta'=>$row->id,'paged'=>$p),$url)); ?>">Ver respuesta <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></a>
            </li>
        <?php endforeach; ?>
        </ul>
        <?php if($pages>1): ?><nav aria-label="Páginas de respuestas"><?php echo wp_kses_post(paginate_links(array('base'=>str_replace('999999','%#%',add_query_arg('paged',999999,$url)),'format'=>'','current'=>$p,'total'=>$pages,'prev_text'=>'Anterior','next_text'=>'Siguiente'))); ?></nav><?php endif; ?>
        <?php endif; ?>
    </section>
</div>
