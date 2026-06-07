package com.japanese.backend.entity.converter;

import com.japanese.backend.entity.ExamQuestion;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

@Converter
public class ExamQuestionListConverter extends JsonAttributeConverter<List<ExamQuestion>>
        implements AttributeConverter<List<ExamQuestion>, String> {

    public ExamQuestionListConverter() {
        super(List.class, ExamQuestion.class);
    }

    @Override
    public String convertToDatabaseColumn(List<ExamQuestion> attribute) {
        return toJson(attribute);
    }

    @Override
    public List<ExamQuestion> convertToEntityAttribute(String dbData) {
        return fromJson(dbData);
    }
}
