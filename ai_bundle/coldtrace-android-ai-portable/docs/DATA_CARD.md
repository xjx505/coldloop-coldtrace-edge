# Data card

**Processed source:** [NifferLi/Cold-Chain-Transportation-Strawberry](https://huggingface.co/datasets/NifferLi/Cold-Chain-Transportation-Strawberry), `article_release/ALL_benchmark_W60.parquet` at repository revision `4f9541d8a20616b3c5fedc7d9fd27a8a0b6701dc`. The processed dataset repository declares Apache-2.0.

**Underlying field measurements:** Alla Abdella, Jeffrey K. Brecht, and Ismail Uysal, [“A Time-Temperature Dataset for the Strawberry Cold Chain Across Multiple Shipments and Locations”](https://arxiv.org/abs/2103.12895), arXiv:2103.12895 (2021). This is the dataset description/preprint title.

**Related journal publication of the analysis:** Alla Abdella, Jeffrey K. Brecht, and Ismail Uysal, [“Statistical and temporal analysis of a novel multivariate time series data for food engineering”](https://doi.org/10.1016/j.jfoodeng.2021.110477), *Journal of Food Engineering*, vol. 298, article 110477 (2021), DOI: 10.1016/j.jfoodeng.2021.110477. The journal article title differs from the dataset preprint title; the earlier single citation incorrectly combined the preprint title with the journal volume/article number.

The local Parquet is 14,398 rows, 107 columns, six physical shipments (`S1`–`S6`), and nine nominal probe positions (front/middle/rear × top/middle/bottom). It includes missing sensors, 10-minute resampled timestamps, 60-minute historical features, current risk labels, and a future 120-minute target. It contains **no** measured Qatar facility, GPS, door, reefer alarm, humidity, action response, or operational cause ground truth.

Some summaries of the wider Hugging Face repository report approximately 100,786 rows. The actual named article-release file downloaded and hashed for this build is 14,398 rows. Row count is never treated as shipment count.

The application bundles this Parquet for offline demonstration. Operational scenarios and the weak-point table are synthetic and explicitly labeled. `cause_*` fields in the source are not accepted as true operational cause labels and are excluded from model features.
