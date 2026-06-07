param(
    [string]$JmdictPath = "../data/dictionary/JMdict_e",
    [string]$KanjidicPath = "../data/dictionary/kanjidic2.xml"
)

.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--dictionary.import=true --dictionary.jmdict-path=$JmdictPath --dictionary.kanjidic-path=$KanjidicPath"
