import com.opencsv.CSVParser;
import com.opencsv.CSVReader;
import com.opencsv.CSVWriter;
import com.opencsv.ICSVWriter;
import com.opencsv.exceptions.CsvException;
import lombok.ToString;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.text.StringEscapeUtils;

import java.io.*;
import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

public class Main {

    private static final String SAMPLE_ID = "SampleID";
    private static final String LOCUS = "Locus";
    private static final String ALLELE_1 = "FinalAssignmentAllele1";
    private static final String ALLELE_2 = "FinalAssignmentAllele2";

    private List<FinalFile> ids = new ArrayList<>();

    public static void main(String[] args) throws Exception {
        new Main().generate();
    }

    public void generate() throws Exception {
        BufferedWriter writer = new BufferedWriter(new FileWriter("output.txt"));
        StringBuilder sb = new StringBuilder();
        for (FieldLength fl : FieldLength.values()) {
            sb.append(fl.fieldLength);
        }
        writer.write(sb.toString());
        Stream.of(Objects.requireNonNull(new File("C:\\dev\\projects\\allele\\files").listFiles())).forEach(file -> {
            System.out.println("Processing file: " + file.getName());
            if (file.getName().endsWith("zip")) {
                System.out.println("Using zip file: " + file.getName());
                ZipFile zipFile = null;
                try {
                    zipFile = new ZipFile(file, ZipFile.OPEN_READ);
                    Enumeration<? extends ZipEntry> entries = zipFile.entries();
                    while(entries.hasMoreElements()){
                        ZipEntry entry = entries.nextElement();
                        if (entry.getName().endsWith("csv")) {
                            System.out.println("Using csv file: " + entry.getName());
                            InputStream stream = zipFile.getInputStream(entry);
                            try {
                                saveResult(writer, stream);
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        } else {
                            System.out.println("Omiting file: " + entry.getName());
                        }
                    }
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }
        });
        System.out.println("Unique quantity: " + new HashSet<>(ids).size());
        System.out.println("Root: " + ids.size());
        HashMap<FinalFile, Integer> stringIntegerHashMap = new HashMap<>();
        for (FinalFile f : ids) {
            if (stringIntegerHashMap.containsKey(f)) {

                stringIntegerHashMap.keySet().forEach(fi -> {
                    if (fi.equals(f)) {
                        System.out.println("Original");
                        System.out.println(fi);
                    }
                });
                System.out.println("Duplicate");
                System.out.println(f);
                stringIntegerHashMap.put(f, stringIntegerHashMap.get(f) + 1);

            } else {
                stringIntegerHashMap.put(f, 1);
            }
        }

        writer.flush();
        writer.close();
    }

    private void saveResult(BufferedWriter writer, InputStream file) throws IOException, CsvException, IllegalAccessException, NoSuchFieldException {
        Map<String, Integer> headerToKey = new HashMap<>();
        Map<String, FinalFile> target = new HashMap<>();
        //writer.writeNext();
        try (CSVReader reader = new CSVReader(new InputStreamReader(file))) {
            List<String[]> r = reader.readAll();
            extractHeaders(headerToKey, r);
            for (int i  = 1; i < r.size(); i++) {
                String [] row = r.get(i);
                String key = row[headerToKey.get(SAMPLE_ID)];
                FinalFile finalFile = target.containsKey(key) ? target.get(key) : new FinalFile();
                target.put(key, finalFile);
                finalFile.setValue("ID", key);
                Allels allels = Allels.valueOf(row[headerToKey.get(LOCUS)]);
                if (allels.equals(Allels.DRB345)) {
                    if (StringUtils.isNotBlank(row[headerToKey.get(ALLELE_1)])) {
                        String[] separatedFields = StringUtils.splitByWholeSeparator(row[headerToKey.get(ALLELE_1)], "*");
                        finalFile.setValue(allels.colName + separatedFields[0] + "1", separatedFields[1]);
                    }
                    if (StringUtils.isNotBlank(row[headerToKey.get(ALLELE_2)])) {
                        String[] separatedFields = StringUtils.splitByWholeSeparator(row[headerToKey.get(ALLELE_2)], "*");
                        finalFile.setValue(allels.colName + separatedFields[0] + "2", separatedFields[1]);
                    }
                } else {
                    if (StringUtils.isNotBlank(row[headerToKey.get(ALLELE_1)])) {
                        finalFile.setValue(allels.colName + "1", row[headerToKey.get(ALLELE_1)]);
                    }
                    if (StringUtils.isNotBlank(row[headerToKey.get(ALLELE_2)])) {
                        finalFile.setValue(allels.colName + "2", row[headerToKey.get(ALLELE_2)]);
                    }
                }
            }
        }
        Collection<FinalFile> values = target.values().stream().sorted().toList();
        System.out.println(values.size());
        for (FinalFile f : values) {
            ids.add(f);
            StringBuilder fin = new StringBuilder();
            for (FieldLength field : FieldLength.values()) {
                String val = (String) FinalFile.class.getDeclaredField(StringUtils.deleteWhitespace(field.fieldLength)).get(f);
                fin.append(StringUtils.rightPad(val == null ? "" : val, field.fieldLength.length()));
            }
            writer.newLine();
            writer.write(fin.toString());
        }
    }

    private void extractHeaders(Map<String, Integer> headerToKey, List<String[]> r) {
        String[] headers = r.get(0);
        for (int i = 0; i < headers.length; i++) {
            String header = headers[i];
            if (header.equals(SAMPLE_ID) || header.equals(LOCUS) || header.equals(ALLELE_1) || header.equals(ALLELE_2)) {
                headerToKey.put(header, i);
            }
        }
    }

    private enum Allels {
        A("DA"),
        B("DB"),
        C("DC"),
        DRB1("RB1"),
        DRB345("RB"),
        DQA1("QA1"),
        DQB1("QB1"),
        DPA1("PA1"),
        DPB1("PB1");

        private String colName;

        Allels(String colName) {
            this.colName = colName;
        }

    }

    private enum FieldLength {
       ID("ID          "),
       A1("A1   "),
       A2("A2   "),
       DA1("DA1                  "),
       DA2("DA2                  "),
       B1("B1   "),
       B2("B2   "),
       DB1("DB1                  "),
       DB2("DB2                  "),
       C1("C1   "),
       C2("C2   "),
       DC1("DC1                  "),
       DC2("DC2                  "),
       D1("D1   "),
       D2("D2   "),
       RB11("RB11                 "),
       RB12("RB12                 "),
       RB31("RB31                 "),
       RB32("RB32                 "),
       RB41("RB41                 "),
       RB42("RB42                 "),
       RB51("RB51                 "),
       RB52("RB52                 "),
       Q1("Q1   "),
       Q2("Q2   "),
       QB11("QB11                 "),
       QB12("QB12                 "),
       QA11("QA11                 "),
       QA12("QA12                 "),
       P1("P1   "),
       P2("P2   "),
       PA11("PA11                 "),
       PA12("PA12                 "),
       PB11("PB11                 "),
       PB12("PB12                 "),
       GND("GND                  "),
       DOB("DOB");
       private String fieldLength;

       FieldLength(String fieldLength) {
           this.fieldLength = fieldLength;
       }
    }


    @ToString
    private static class FinalFile implements Comparable<FinalFile> {
        String ID;
        String A1;
        String A2;
        String DA1;
        String DA2;
        String B1;
        String B2;
        String DB1;
        String DB2;
        String C1;
        String C2;
        String DC1;
        String DC2;
        String D1;
        String D2;
        String RB11;
        String RB12;
        String RB31;
        String RB32;
        String RB41;
        String RB42;
        String RB51;
        String RB52;
        String Q1;
        String Q2;
        String QB11;
        String QB12;
        String QA11;
        String QA12;
        String P1;
        String P2;
        String PA11;
        String PA12;
        String PB11;
        String PB12;
        String GND;
        String DOB;

        public void setValue(String fieldName, String value) throws IllegalAccessException {
            Field[] fields = this.getClass().getDeclaredFields();
            for (Field f : fields) {
                f.setAccessible(true);
                if (f.getName().equals(fieldName)) {
                    f.set(this, value);
                    return;
                }
            }
            System.err.println("Field not found: " + fieldName + " " + value);
        }

        @Override
        public int compareTo(FinalFile o) {
            return this.ID.compareTo(o.ID);
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            FinalFile finalFile = (FinalFile) o;
            return ID.equals(finalFile.ID);
        }

        @Override
        public int hashCode() {
            return Objects.hash(ID);
        }
    }
}
