package com.codexaniket.essentials.osm;

import java.util.Map;

/**
 * One shop/service returned by Overpass, already flattened:
 * nodes have lat/lon directly, ways and relations come with a "center" point.
 */
public record OsmPlace(String osmId, double latitude, double longitude, Map<String, String> tags) {

    public String tag(String... keys) {
        for (String key : keys) {
            String value = tags.get(key);
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    /** Builds "12, MG Road, Katpadi, Vellore 632007" from the addr:* tags. */
    public String address() {
        String full = tag("addr:full");
        if (full != null) {
            return full;
        }
        StringBuilder sb = new StringBuilder();
        append(sb, tag("addr:housenumber"));
        append(sb, tag("addr:street"));
        append(sb, tag("addr:suburb", "addr:neighbourhood", "addr:place"));
        append(sb, tag("addr:city", "addr:district"));
        String postcode = tag("addr:postcode");
        if (postcode != null) {
            sb.append(sb.isEmpty() ? "" : " ").append(postcode);
        }
        return sb.isEmpty() ? null : sb.toString();
    }

    private static void append(StringBuilder sb, String part) {
        if (part != null) {
            sb.append(sb.isEmpty() ? "" : ", ").append(part);
        }
    }
}
