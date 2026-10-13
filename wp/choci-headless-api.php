<?php
/*
Plugin Name: Choci Headless API (קריאה בלבד)
Description: נקודת נתונים לחלון הראווה החדש (Next.js). מחזירה את הנתונים הציבוריים של כל כתובת באתר כ-JSON, כשמוסיפים לה ?choci_api=1. לא כותבת כלום ולא משנה כלום. לנטרול: למחוק או לשנות את שם הקובץ. נוסף 13.10.2026.
*/
if (!defined('ABSPATH')) { exit; }

define('CHX_VERSION', '2');

/* הבקשה עוברת דרך וורדפרס כמו עמוד רגיל — אותה שאילתה, אותם סינונים, אותו מיון, אותן הפניות.
   רק במקום לבנות HTML, מחזירים את הנתונים. */
add_action('template_redirect', 'chx_maybe_serve', 50);

function chx_maybe_serve() {
    if (!isset($_GET['choci_api'])) { return; }
    if (is_user_logged_in()) { return; } // רק התצוגה הציבורית
    nocache_headers();
    header('Content-Type: application/json; charset=utf-8');
    header('X-Choci-Api: ' . CHX_VERSION);
    $what = sanitize_key($_GET['choci_api']);
    try {
        if ($what === 'layout') { $data = chx_layout(); }
        else { $data = chx_page(); }
    } catch (\Throwable $e) {
        status_header(500);
        $data = array('error' => $e->getMessage());
    }
    echo wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function chx_rel($url) {
    $home = untrailingslashit(home_url());
    if (is_string($url) && strpos($url, $home) === 0) { $url = substr($url, strlen($home)); return $url === '' ? '/' : $url; }
    return $url;
}

/* ---------- נתונים משותפים לכל העמודים ---------- */
function chx_layout() {
    $header = function_exists('choci_header_from_home') ? choci_header_from_home() : '';
    $wish_page = get_page_by_path('wishlist');
    return array(
        'header_html' => $header,
        'footer_html' => (string) get_option('choci_global_footer', ''),
        'nonce_cart'  => wp_create_nonce('choci_cart'),
        'nonce_wish'  => wp_create_nonce('choci_wish'),
        'nonce_club'  => wp_create_nonce('choci_club'),
        // העיצוב שנשמר בהגדרות האתר (Customizer) — כך שינויי עיצוב שנעשים שם ממשיכים לעבוד
        'custom_css'  => wp_strip_all_tags(wp_get_custom_css()),
        'wishlist_url'=> chx_rel($wish_page ? get_permalink($wish_page) : home_url('/wishlist/')),
        'shop_url'    => chx_rel(wc_get_page_permalink('shop')),
        'cart_url'    => chx_rel(wc_get_cart_url()),
        'free_ship_min' => function_exists('choci_free_ship_min') ? (float) choci_free_ship_min() : 0,
    );
}

/* ---------- עמוד ---------- */
function chx_page() {
    global $wp_query;
    $out = array(
        'v' => CHX_VERSION,
        'status' => is_404() ? 404 : 200,
        'body_class' => get_body_class(),
        'doc_title' => wp_get_document_title(),
        'seo_head' => chx_seo_head(),
    );
    if (function_exists('is_product_category') && (is_product_category() || is_shop() || is_product_tag() || (is_search() && get_query_var('post_type') === 'product'))) {
        $out['type'] = 'archive';
        $out['archive'] = chx_archive();
    } else {
        $out['type'] = 'other';
    }
    return $out;
}

/* המטא של Rank Math (תיאור, קנוניקל, שיתוף, סכמה) */
function chx_seo_head() {
    if (!has_action('rank_math/head')) { return ''; }
    ob_start();
    do_action('rank_math/head');
    return chx_rel_html(ob_get_clean());
}

function chx_rel_html($html) {
    return str_replace(untrailingslashit(home_url()) . '/', '/', (string) $html);
}

/* ---------- כרטיס מוצר ---------- */
function chx_image($attachment_id, $size = 'woocommerce_thumbnail') {
    if (!$attachment_id) {
        return array('placeholder' => true, 'src' => wc_placeholder_img_src($size), 'alt' => 'Placeholder', 'width' => 300, 'height' => 300, 'srcset' => '', 'sizes' => '');
    }
    $src = wp_get_attachment_image_src($attachment_id, $size);
    if (!$src) { return null; }
    $meta = wp_get_attachment_metadata($attachment_id);
    $srcset = wp_get_attachment_image_srcset($attachment_id, $size, $meta);
    $sizes = wp_get_attachment_image_sizes($attachment_id, $size, $meta);
    return array(
        'id' => (int) $attachment_id,
        'src' => $src[0], 'width' => (int) $src[1], 'height' => (int) $src[2],
        'srcset' => $srcset ? $srcset : '', 'sizes' => $sizes ? $sizes : '',
        'alt' => trim(wp_strip_all_tags((string) get_post_meta($attachment_id, '_wp_attachment_image_alt', true))),
    );
}

function chx_badge($p) {
    if (function_exists('choci_deal_for_product')) {
        $deal = choci_deal_for_product($p->get_id());
        if ($deal) { return array('cls' => 'onsale choci-deal-badge', 'label' => $deal['label']); }
    }
    if ($p->is_on_sale()) {
        // תווית המבצע הרגילה של ווקומרס
        return array('cls' => 'onsale', 'label' => wp_strip_all_tags(apply_filters('woocommerce_sale_flash', '<span class="onsale">' . esc_html__('Sale!', 'woocommerce') . '</span>', get_post($p->get_id()), $p)), 'wc' => true);
    }
    $sale_cat = (int) get_option('choci_sale_cat_id', 0);
    if ($sale_cat && has_term($sale_cat, 'product_cat', $p->get_id())) {
        return array('cls' => 'onsale choci-cat-onsale', 'label' => 'מבצע');
    }
    return null;
}

function chx_card($p) {
    if (!$p) { return null; }
    $id = $p->get_id();
    $classes = wc_get_product_class('', $p);
    $classes = array_values(array_diff($classes, array('first', 'last')));
    $short = $p->get_short_description();
    $type = $p->get_type();
    return array(
        'id' => $id,
        'name' => $p->get_name(),
        'link' => chx_rel($p->get_permalink()),
        'type' => $type,
        'classes' => $classes,
        'image' => chx_image($p->get_image_id()),
        'price_html' => chx_rel_html($p->get_price_html()),
        'short_html' => $short !== '' ? chx_rel_html(apply_filters('woocommerce_short_description', $short)) : '',
        'purchasable' => $p->is_purchasable(),
        'in_stock' => $p->is_in_stock(),
        'badge' => chx_badge($p),
    );
}

/* ---------- ארכיון (קטגוריה, חנות, חיפוש) ---------- */
function chx_archive() {
    global $wp_query;
    $term = is_product_taxonomy() ? get_queried_object() : null;
    $paged = max(1, (int) get_query_var('paged'));

    $products = array();
    foreach ($wp_query->posts as $post) {
        $c = chx_card(wc_get_product($post));
        if ($c) { $products[] = $c; }
    }

    $a = array(
        'paged' => $paged,
        'max_pages' => (int) $wp_query->max_num_pages,
        'found' => (int) $wp_query->found_posts,
        'per_page' => (int) $wp_query->get('posts_per_page'),
        'columns' => wc_get_default_products_per_row(),
        'display_mode' => function_exists('woocommerce_get_loop_display_mode') ? woocommerce_get_loop_display_mode() : 'products',
        'is_search' => is_search(),
        'search_query' => get_search_query(),
        'is_shop' => is_shop(),
        'page_title' => woocommerce_page_title(false),
        'orderby' => isset($_GET['orderby']) ? wc_clean(wp_unslash($_GET['orderby'])) : apply_filters('woocommerce_default_catalog_orderby', get_option('woocommerce_default_catalog_orderby', 'menu_order')),
        'catalog_orderby' => apply_filters('woocommerce_catalog_orderby', array(
            'menu_order' => __('Default sorting', 'woocommerce'),
            'popularity' => __('Sort by popularity', 'woocommerce'),
            'rating'     => __('Sort by average rating', 'woocommerce'),
            'date'       => __('Sort by latest', 'woocommerce'),
            'price'      => __('Sort by price: low to high', 'woocommerce'),
            'price-desc' => __('Sort by price: high to low', 'woocommerce'),
        )),
        'products' => $products,
        'result_count' => chx_capture('woocommerce_result_count'),
        'term' => null,
        'subcategories' => array(),
        'sidebar' => chx_sidebar(),
    );
    if ('no' === get_option('woocommerce_enable_review_rating')) { unset($a['catalog_orderby']['rating']); }

    if ($term && !is_wp_error($term)) {
        $children = get_terms(array('taxonomy' => $term->taxonomy, 'hide_empty' => false, 'parent' => $term->term_id, 'fields' => 'ids'));
        $a['term'] = array(
            'id' => (int) $term->term_id,
            'name' => $term->name,
            'slug' => $term->slug,
            'taxonomy' => $term->taxonomy,
            'link' => chx_rel(get_term_link($term)),
            'description_html' => empty($term->description) ? '' : chx_rel_html(wpautop(wp_kses_post($term->description))),
            'has_children' => !is_wp_error($children) && !empty($children),
            'tips' => function_exists('choci_get_tips_for_term') ? array_values(array_map('chx_rel_tip', choci_get_tips_for_term($term->term_id))) : array(),
            'related' => chx_related($term),
            'deal' => chx_deal_for_term($term),
        );
    }
    if (in_array($a['display_mode'], array('subcategories', 'both'), true)) {
        $parent = $term ? (int) $term->term_id : 0;
        foreach (woocommerce_get_product_subcategories($parent) as $cat) {
            $thumb = (int) get_term_meta($cat->term_id, 'thumbnail_id', true);
            $a['subcategories'][] = array('id' => (int) $cat->term_id, 'name' => $cat->name, 'slug' => $cat->slug, 'count' => (int) $cat->count, 'link' => chx_rel(get_term_link($cat)), 'image' => chx_image($thumb));
        }
    }
    return $a;
}

function chx_rel_tip($t) {
    foreach (array('img', 'url', 'mascot') as $k) { if (!empty($t[$k])) { $t[$k] = chx_rel($t[$k]); } }
    return $t;
}

function chx_capture($fn) {
    if (!function_exists($fn)) { return ''; }
    ob_start();
    $fn();
    return trim(wp_strip_all_tags(ob_get_clean()));
}

function chx_related($term) {
    $ids = get_term_meta($term->term_id, '_choci_cat_related', true);
    if (!is_array($ids) || empty($ids)) { return null; }
    $title = get_term_meta($term->term_id, '_choci_cat_related_title', true);
    $items = array();
    foreach ($ids as $pid) {
        $p = wc_get_product($pid);
        if (!$p || 'publish' !== get_post_status($pid)) { continue; }
        $items[] = array('name' => $p->get_name(), 'link' => chx_rel(get_permalink($pid)), 'price_html' => chx_rel_html($p->get_price_html()), 'image' => chx_image(get_post_thumbnail_id($pid)));
    }
    return $items ? array('title' => $title ? $title : 'משלימים את הקנייה', 'items' => $items) : null;
}

function chx_deal_for_term($term) {
    if (!function_exists('choci_deal_config')) { return null; }
    $cfgs = choci_deal_config();
    $out = array();
    if (!empty($cfgs[(int) $term->term_id])) {
        $cfg = $cfgs[(int) $term->term_id];
        $out['banner'] = array('label' => $cfg['label'], 'qty' => (int) $cfg['qty'], 'price_html' => wc_price($cfg['price']));
    }
    if ((int) $term->term_id === (int) get_option('choci_sale_cat_id', 0) && !empty($cfgs)) {
        $up = wp_upload_dir();
        $cards = array();
        foreach ($cfgs as $tid => $cfg) {
            $t = get_term((int) $tid, 'product_cat');
            if (!$t || is_wp_error($t)) { continue; }
            $link = get_term_link($t);
            if (is_wp_error($link)) { continue; }
            $cards[] = array('label' => $cfg['label'], 'qty' => (int) $cfg['qty'], 'link' => chx_rel($link), 'count' => (int) $t->count, 'img' => function_exists('choci_deal_banner_url') ? chx_rel(choci_deal_banner_url($cfg)) : '');
        }
        $out['strip'] = array('mascot' => chx_rel(trailingslashit($up['baseurl']) . '2026/08/choci-mascot-happy.png'), 'cards' => $cards);
    }
    return $out ? $out : null;
}

/* ---------- סרגל הסינון — אותו חישוב כמו הווידג'טים של ווקומרס ---------- */
function chx_sidebar() {
    $sw = wp_get_sidebars_widgets();
    $ids = isset($sw['sidebar-primary']) ? (array) $sw['sidebar-primary'] : array();
    $out = array('active' => !empty($ids), 'clear_link' => null, 'widgets' => array());
    if (empty($ids)) { return $out; }

    // כפתור ניקוי הסינונים (choci-clear-filters)
    if (function_exists('choci_clear_filters_button')) {
        ob_start();
        choci_clear_filters_button('sidebar-primary');
        $h = ob_get_clean();
        if ($h && preg_match('/href="([^"]+)"/', $h, $m)) { $out['clear_link'] = chx_rel(html_entity_decode($m[1])); }
    }

    $layered = get_option('widget_woocommerce_layered_nav', array());
    $pricew = get_option('widget_woocommerce_price_filter', array());
    $nav = class_exists('WC_Widget_Layered_Nav') ? new WC_Widget_Layered_Nav() : null;
    $chosen = WC_Query::get_layered_nav_chosen_attributes();

    foreach ($ids as $wid) {
        if (preg_match('/^woocommerce_layered_nav-(\d+)$/', $wid, $m) && $nav && isset($layered[$m[1]])) {
            $w = chx_layered_widget($nav, $layered[$m[1]], $chosen);
            if ($w) { $w['id'] = $wid; $out['widgets'][] = $w; }
        } elseif (preg_match('/^woocommerce_price_filter-(\d+)$/', $wid, $m) && isset($pricew[$m[1]])) {
            $w = chx_price_widget($pricew[$m[1]]);
            if ($w) { $w['id'] = $wid; $out['widgets'][] = $w; }
        }
    }
    return $out;
}

function chx_call_protected($obj, $method, $args) {
    $r = new ReflectionMethod($obj, $method);
    $r->setAccessible(true);
    return $r->invokeArgs($obj, $args);
}

function chx_layered_widget($nav, $inst, $chosen) {
    if (!is_shop() && !is_product_taxonomy()) { return null; }
    $taxonomy = wc_attribute_taxonomy_name(isset($inst['attribute']) ? $inst['attribute'] : '');
    $query_type = isset($inst['query_type']) ? $inst['query_type'] : 'and';
    if (!taxonomy_exists($taxonomy)) { return null; }
    $terms = get_terms(array('taxonomy' => $taxonomy, 'hide_empty' => '1'));
    if (is_wp_error($terms) || 0 === count($terms)) { return null; }

    $term_counts = chx_call_protected($nav, 'get_filtered_term_product_counts', array(wp_list_pluck($terms, 'term_id'), $taxonomy, $query_type));
    $base_link = chx_call_protected($nav, 'get_current_page_url', array());
    $items = array();
    $found = false;
    foreach ($terms as $term) {
        $current_values = isset($chosen[$taxonomy]['terms']) ? $chosen[$taxonomy]['terms'] : array();
        $option_is_set = in_array($term->slug, $current_values, true);
        $count = isset($term_counts[$term->term_id]) ? $term_counts[$term->term_id] : 0;
        // אותו כלל כמו בווקומרס: לא מציגים את הקטגוריה הנוכחית כאפשרות
        if (is_tax($taxonomy) && get_queried_object_id() === $term->term_id) { continue; }
        if (0 < $count) { $found = true; }
        elseif (0 === $count && !$option_is_set) { continue; }

        $filter_name = 'filter_' . wc_attribute_taxonomy_slug($taxonomy);
        $current_filter = isset($_GET[$filter_name]) ? explode(',', wc_clean(wp_unslash($_GET[$filter_name]))) : array();
        $current_filter = array_map('sanitize_title', $current_filter);
        if (!in_array($term->slug, $current_filter, true)) { $current_filter[] = $term->slug; }
        $link = remove_query_arg($filter_name, $base_link);
        foreach ($current_filter as $key => $value) {
            if ($option_is_set && $value === $term->slug) { unset($current_filter[$key]); }
            if (!term_exists($value, $taxonomy)) { unset($current_filter[$key]); }
        }
        if (!empty($current_filter)) {
            asort($current_filter);
            $link = add_query_arg($filter_name, implode(',', $current_filter), $link);
            if ('or' === $query_type && !($option_is_set && 1 === count($current_filter))) {
                $link = add_query_arg('query_type_' . wc_attribute_taxonomy_slug($taxonomy), 'or', $link);
            }
            $link = str_replace('%2C', ',', $link);
        }
        $link = apply_filters('woocommerce_layered_nav_link', $link, $term, $taxonomy);
        $items[] = array('name' => $term->name, 'slug' => $term->slug, 'count' => (int) $count, 'chosen' => $option_is_set, 'href' => ($count > 0 || $option_is_set) ? chx_rel($link) : null);
    }
    if (!$found) { return null; }
    return array('kind' => 'layered_nav', 'title' => isset($inst['title']) ? $inst['title'] : '', 'taxonomy' => $taxonomy, 'items' => $items);
}

function chx_price_widget($inst) {
    if (!is_shop() && !is_product_taxonomy()) { return null; }
    $q = WC()->query->get_main_query();
    if ($q && !$q->post_count && !isset($_GET['min_price']) && !isset($_GET['max_price'])) { return null; }
    $w = new WC_Widget_Price_Filter();
    $prices = chx_call_protected($w, 'get_filtered_price', array());
    $step = max(apply_filters('woocommerce_price_filter_widget_step', 10), 1);
    $min_price = apply_filters('woocommerce_price_filter_widget_min_amount', floor($prices->min_price / $step) * $step);
    $max_price = apply_filters('woocommerce_price_filter_widget_max_amount', ceil($prices->max_price / $step) * $step);
    if ($min_price === $max_price) { return null; }
    $current_min = isset($_GET['min_price']) ? floor(floatval(wp_unslash($_GET['min_price'])) / $step) * $step : $min_price;
    $current_max = isset($_GET['max_price']) ? ceil(floatval(wp_unslash($_GET['max_price'])) / $step) * $step : $max_price;
    // שדות נסתרים שמשמרים את שאר הסינונים
    $hidden = array();
    foreach ($_GET as $key => $val) {
        if (in_array($key, array('min_price', 'max_price', 'paged', 'choci_api'), true)) { continue; }
        if (is_array($val)) { continue; }
        $hidden[] = array('name' => $key, 'value' => wp_unslash($val));
    }
    return array('kind' => 'price_filter', 'title' => isset($inst['title']) ? $inst['title'] : '', 'step' => $step,
        'min' => $min_price, 'max' => $max_price, 'cur_min' => $current_min, 'cur_max' => $current_max, 'hidden' => $hidden);
}
