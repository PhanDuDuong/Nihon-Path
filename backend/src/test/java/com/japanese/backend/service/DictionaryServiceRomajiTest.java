package com.japanese.backend.service;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DictionaryServiceRomajiTest {

    @Test
    void romajiDoubleNMapsToNBeforeNextSyllable() throws Exception {
        DictionaryService service = new DictionaryService(null, null);
        Method method = DictionaryService.class.getDeclaredMethod("romajiToHiragana", String.class);
        method.setAccessible(true);

        assertEquals("こんにちは", method.invoke(service, "konnichiha"));
        assertEquals("あんな", method.invoke(service, "anna"));
        assertEquals("てんのう", method.invoke(service, "tennou"));
    }
}
