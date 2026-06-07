package com.japanese.backend.entity.converter;

import com.japanese.backend.entity.ExamSection;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

@Converter
public class ExamSectionListConverter extends JsonAttributeConverter<List<ExamSection>>
        implements AttributeConverter<List<ExamSection>, String> {

    public ExamSectionListConverter() {
        super(List.class, ExamSection.class);
    }

    @Override
    public String convertToDatabaseColumn(List<ExamSection> attribute) {
        return toJson(attribute);
    }

    @Override
    public List<ExamSection> convertToEntityAttribute(String dbData) {
        return fromJson(dbData);
    }
}
