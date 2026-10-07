package com.codexaniket.essentials.osm;

/** OpenStreetMap could not be reached, timed out, or sent something we could not read. */
public class OsmUnavailableException extends RuntimeException {

    public OsmUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
