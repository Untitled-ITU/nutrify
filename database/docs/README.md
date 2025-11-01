\# Database ERD (v0)



Aşağıda PostgreSQL tablo ve ilişkileri mermaid ile gösterilmiştir.



```mermaid

%% Kaynak: database/docs/erd\_v0.mmd

erDiagram

&nbsp; %% kısa önizleme

&nbsp; RECIPE ||--o{ RECIPE\_INGREDIENT : contains

&nbsp; INGREDIENT ||--o{ RECIPE\_INGREDIENT : used\_in

&nbsp; RECIPE ||--o{ RECIPE\_TAG : has

&nbsp; TAG ||--o{ RECIPE\_TAG : categorizes

&nbsp; RECIPE ||--o{ INSTRUCTION : step\_by\_step

&nbsp; RECIPE ||--|| NUTRITION   : has



