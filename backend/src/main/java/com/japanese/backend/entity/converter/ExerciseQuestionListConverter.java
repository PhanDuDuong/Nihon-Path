package com.japanese.backend.entity.converter;

import com.japanese.backend.entity.ExerciseQuestion;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

@Converter
public class ExerciseQuestionListConverter extends JsonAttributeConverter<List<ExerciseQuestion>>
        implements AttributeConverter<List<ExerciseQuestion>, String> {

    public ExerciseQuestionListConverter() {
        super(List.class, ExerciseQuestion.class);
    }

    @Override
    public String convertToDatabaseColumn(List<ExerciseQuestion> attribute) {
        return toJson(attribute);
    }

    @Override
    public List<ExerciseQuestion> convertToEntityAttribute(String dbData) {
        return fromJson(dbData);
    }
}
