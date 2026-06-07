package com.japanese.backend.entity.converter;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;

import java.io.IOException;
import java.util.Collection;
import java.util.Locale;

public abstract class JsonAttributeConverter<T> {

    private static final ObjectMapper OBJECT_MAPPER = buildObjectMapper();
    private final JavaType javaType;

    protected JsonAttributeConverter(Class<? extends Collection> collectionClass, Class<?> itemClass) {
        this.javaType = OBJECT_MAPPER.getTypeFactory().constructCollectionType(collectionClass, itemClass);
    }

    public String toJson(T value) {
        if (value == null) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Khong the ghi JSON", ex);
        }
    }

    public T fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.readValue(value, javaType);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Khong the doc JSON: " + ex.getOriginalMessage(), ex);
        }
    }

    private static ObjectMapper buildObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        SimpleModule module = new SimpleModule();
        module.addDeserializer(Boolean.class, new FlexibleBooleanDeserializer());
        module.addDeserializer(boolean.class, new FlexibleBooleanDeserializer());
        mapper.registerModule(module);
        return mapper;
    }

    private static final class FlexibleBooleanDeserializer extends JsonDeserializer<Boolean> {
        @Override
        public Boolean deserialize(JsonParser parser, DeserializationContext context) throws IOException {
            JsonToken token = parser.currentToken();
            if (token == JsonToken.VALUE_TRUE) {
                return Boolean.TRUE;
            }
            if (token == JsonToken.VALUE_FALSE) {
                return Boolean.FALSE;
            }
            if (token == JsonToken.VALUE_NUMBER_INT) {
                return parser.getIntValue() != 0;
            }
            if (token == JsonToken.VALUE_STRING) {
                String value = parser.getText().trim().toLowerCase(Locale.ROOT);
                if (value.isEmpty()) {
                    return null;
                }
                if ("true".equals(value) || "1".equals(value) || "base64:type16:aq==".equals(value)) {
                    return Boolean.TRUE;
                }
                if ("false".equals(value) || "0".equals(value) || "base64:type16:aa==".equals(value)) {
                    return Boolean.FALSE;
                }
            }
            return (Boolean) context.handleUnexpectedToken(Boolean.class, parser);
        }
    }
}
