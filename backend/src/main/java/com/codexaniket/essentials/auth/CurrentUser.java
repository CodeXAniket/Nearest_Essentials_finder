package com.codexaniket.essentials.auth;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Put this on an AppUser controller parameter to receive the logged-in user.
 *
 * <pre>
 * public List&lt;PlaceDto&gt; favorites(@CurrentUser AppUser user)            // 401 if not logged in
 * public SearchResponse search(@CurrentUser(required = false) AppUser user) // null if not logged in
 * </pre>
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentUser {

    boolean required() default true;
}
