<?php
defined('ABSPATH') || exit;
?>
<div class="wrap cyl-record">
    <a class="cyl-record__back" href="<?php echo esc_url($url); ?>">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H5m6-6-6 6 6 6"/></svg>
        Volver a las respuestas
    </a>
    <?php if(!$row): ?>
        <h1>Respuesta no encontrada</h1>
    <?php else:
        $data=json_decode($row->respuestas,true) ?: array();
        $person=trim(($data['first_name'] ?? '').' '.($data['last_name'] ?? ''));
        $score=$data['service_satisfaction'] ?? '';
    ?>
        <header class="cyl-record__cover">
            <div>
                <p class="cyl-record__eyebrow">CYL Neumáticos <span>/</span> Encuesta de satisfacción</p>
                <h1>Respuesta <span>#<?php echo intval($id); ?></span></h1>
                <p class="cyl-record__byline"><?php echo esc_html($person); ?></p>
                <p class="cyl-record__date">Recibida el <?php echo esc_html(mysql2date('d/m/Y',$row->fecha)); ?> a las <?php echo esc_html(mysql2date('H:i',$row->fecha)); ?></p>
            </div>
            <div class="cyl-record__score">
                <span>Satisfacción con el servicio</span>
                <?php if(in_array((string)$score,array('1','2','3','4','5'),true)): ?>
                    <strong><?php echo esc_html($score); ?> <small>/ 5</small></strong>
                <?php else: ?><b>Sin respuesta</b><?php endif; ?>
            </div>
        </header>
        <div class="cyl-record__sections">
        <?php foreach(cyl_enc_schema()['steps'] as $index=>$step): ?>
            <section class="cyl-record__section">
                <h2><small aria-hidden="true"><?php echo esc_html(sprintf('%02d',$index+1)); ?></small><?php echo esc_html($step['title']); ?></h2>
                <dl class="<?php echo $index===0?'cyl-record__identity':'cyl-record__answers'; ?>">
                <?php foreach($step['fields'] as $field):
                    $value=(string)($data[$field['name']] ?? '');
                    $label=$value;
                    foreach($field['options'] ?? array() as $option){
                        if((string)$option['value']===$value){ $label=$option['label']; break; }
                    }
                    $rating=$field['type']==='rating' && in_array($value,array('1','2','3','4','5'),true);
                ?>
                    <div class="<?php echo $rating?'cyl-record__rated':''; ?>">
                        <dt><?php echo esc_html($field['label']); ?></dt>
                        <dd><?php if($rating): ?>
                            <span class="cyl-record__meter" aria-hidden="true"><?php for($i=1;$i<=5;$i++): ?><i class="<?php echo $i<=(int)$value?'filled':''; ?>"></i><?php endfor; ?></span>
                            <strong><?php echo esc_html($value); ?> / 5</strong>
                        <?php elseif($value===''): ?><span class="cyl-record__empty">Sin respuesta</span>
                        <?php else: ?><?php echo nl2br(esc_html($label)); ?><?php endif; ?></dd>
                    </div>
                <?php endforeach; ?>
                </dl>
            </section>
        <?php endforeach; ?>
        </div>
        <details class="cyl-record__manage">
            <summary>Eliminar esta respuesta</summary>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                <input type="hidden" name="action" value="cyl_enc_delete">
                <input type="hidden" name="id" value="<?php echo intval($id); ?>">
                <?php wp_nonce_field('cyl_enc_delete_'.$id); ?>
                <label><input type="checkbox" required name="confirmar" value="si"> Confirmo que quiero eliminar esta respuesta.</label>
                <button class="button">Eliminar respuesta</button>
            </form>
        </details>
    <?php endif; ?>
</div>
