package com.codexaniket.essentials.model;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The kinds of essential places the app can look for.
 *
 * Each category lists the OpenStreetMap tags that describe it. The same list is
 * used twice: to build the Overpass query ("give me every amenity=pharmacy")
 * and to sort the returned elements back into categories.
 */
public enum Category {

    GROCERY("Grocery & Supermarket", "#16a34a",
            List.of(new OsmTag("shop", Set.of("supermarket", "convenience", "greengrocer", "grocery")))),
    PHARMACY("Pharmacy", "#dc2626",
            List.of(new OsmTag("amenity", Set.of("pharmacy")), new OsmTag("shop", Set.of("chemist")))),
    HOSPITAL("Hospital & Clinic", "#db2777",
            List.of(new OsmTag("amenity", Set.of("hospital", "clinic", "doctors")))),
    ATM("ATM", "#2563eb",
            List.of(new OsmTag("amenity", Set.of("atm")))),
    BANK("Bank", "#4f46e5",
            List.of(new OsmTag("amenity", Set.of("bank")))),
    BAKERY("Bakery", "#d97706",
            List.of(new OsmTag("shop", Set.of("bakery")))),
    FUEL("Fuel Station", "#7c3aed",
            List.of(new OsmTag("amenity", Set.of("fuel")))),
    POST_OFFICE("Post Office", "#0891b2",
            List.of(new OsmTag("amenity", Set.of("post_office"))));

    /** One OSM key and the values of it that count, e.g. shop = supermarket | convenience. */
    public record OsmTag(String key, Set<String> values) {

        /** Overpass QL filter: ["shop"="bakery"] for one value, ["shop"~"^(a|b)$"] for several. */
        public String toOverpassFilter() {
            if (values.size() == 1) {
                return "[\"" + key + "\"=\"" + values.iterator().next() + "\"]";
            }
            return "[\"" + key + "\"~\"^(" + String.join("|", values.stream().sorted().toList()) + ")$\"]";
        }

        public boolean matches(Map<String, String> tags) {
            String value = tags.get(key);
            return value != null && values.contains(value);
        }
    }

    private final String label;
    private final String color;
    private final List<OsmTag> osmTags;

    Category(String label, String color, List<OsmTag> osmTags) {
        this.label = label;
        this.color = color;
        this.osmTags = osmTags;
    }

    public String getLabel() {
        return label;
    }

    public String getColor() {
        return color;
    }

    public List<OsmTag> getOsmTags() {
        return osmTags;
    }

    public boolean matches(Map<String, String> tags) {
        return osmTags.stream().anyMatch(tag -> tag.matches(tags));
    }
}
