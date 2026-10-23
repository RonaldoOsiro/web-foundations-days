SnapShare: System Scaling Plan
1. Assumptions and Daily Active Users (DAU)
Registered Users: 10,000,000Activity Rate: 10% of registered users are active daily.Daily Active Users (DAU): $10,000,000 \times 0.10 = 1,000,000\text{ users}$User Actions: Each active user uploads 1 photo per day and views 50 feed pages per day.File Sizes: Average photo size is 2 MB; thumbnail size is 50 KB.Time Conversion: 1 day = 86,400 seconds.

2. Traffic and Storage EstimatesTraffic EstimatesUploads per Day: $1,000,000\text{ users} \times 1\text{ photo/day} = 1,000,000\text{ uploads/day}$Uploads per Second (Average): $\frac{1,000,000}{86,400} \approx 11.57\text{ uploads/sec}$Uploads per Second (Peak, 5×): $11.57 \times 5 \approx 57.85\text{ uploads/sec}$Feed Views per Day: $1,000,000\text{ users} \times 50\text{ views/day} = 50,000,000\text{ feed views/day}$Feed Views per Second (Average): $\frac{50,000,000}{86,400} \approx 578.70\text{ views/sec}$Feed Views per Second (Peak, 5×): $578.70 \times 5 \approx 2,893.50\text{ views/sec}$Storage Estimates (per Year)Total Photos per Year: $1,000,000\text{ uploads/day} \times 365\text{ days} = 365,000,000\text{ photos/year}$Photo Storage: $365,000,000 \times 2\text{ MB} = 730,000,000\text{ MB} \approx 730\text{ TB/year}$Thumbnail Storage: $365,000,000 \times 0.05\text{ MB} = 18,250,000\text{ MB} \approx 18.25\text{ TB/year}$Total Combined Storage: $730\text{ TB} + 18.25\text{ TB} \approx \mathbf{748.25\text{ TB/year}}$

3. Read-Heavy vs. Write-Heavy AnalysisSnapShare is heavily read-heavy. While writes (uploads) occur at an average of ~11.6 requests per second, reads (feed views) occur at ~578.7 requests per second—roughly 50 times more frequently.Design Implications:Optimization must focus heavily on read paths, utilizing aggressive caching layers, Content Delivery Networks (CDNs), and database read replicas to distribute read traffic without bottlenecking the primary database.Write paths can afford slightly more processing overhead (such as asynchronous background queues for thumbnail generation) to keep the upload experience responsive.

4. Object Storage vs. Database StoragePhotos should never be stored directly inside a relational database because databases are optimized for structured tabular data, fast indexing, and transactional integrity; storing binary blobs (BLOBs) degrades query performance, inflates backup sizes, and drives up costly relational database storage. Instead, binary photo and thumbnail files belong in Distributed Object Storage (such as AWS S3), which is architected specifically for cost-effective, durable, and scalable storage of unstructured media.

5. Architecture DiagramPlaintext[ Users / Clients ]
        │
        ▼
   [   CDN   ] ── (Cached Static Assets / Images)
        │
        ▼
[ Load Balancer ]
        │
        ├───────────────────────────────┐
        ▼                               ▼
[ App Server 1 ]                [ App Server 2 ]
        │                               │
        ├──────────────┬────────────────┤
        ▼              ▼                ▼
  [ Cache (Redis) ]  [ Primary DB ]  [ Read Replica DB ]
        │              (Writes)          (Reads)
        │
        ▼
   [ Message Queue ] ──► [ Worker ] ──► [ Object Storage (S3) ]

6. Component ExplanationsCDN (Content Delivery Network): Caches and delivers static photo assets and thumbnails from edge locations closest to users to minimize latency and reduce backend load.Load Balancer: Distributes incoming user traffic evenly across multiple application servers to ensure high availability and prevent single-server overload.App Servers: Execute application business logic, handle authentication, process API requests, and coordinate reads and writes across storage layers.Cache (Redis): Stores frequently accessed metadata (such as user feeds and user profiles) in memory for ultra-fast retrieval and reduced database strain.Database (Primary with Read Replica): The primary database handles write operations (like user metadata and post records), while read replicas handle high-volume read queries to scale performance.Object Storage: Provides scalable, durable, and cost-effective storage for raw image files and generated thumbnails.Queue with Worker: Decouples heavy or non-blocking background tasks (like generating image thumbnails) from the immediate user upload request cycle.

7. Step-by-Step Upload FlowInitiate Upload: The user selects a photo on their client device and sends an HTTP POST request containing the binary image file and metadata to the Load Balancer.Route Request: The Load Balancer forwards the request to an available App Server.Store Original File: The App Server uploads the raw binary photo directly to Object Storage, receiving back a unique storage URL/key.Persist Metadata: The App Server writes the post metadata (caption, user ID, timestamp, and object storage URL) to the Primary Database.Enqueue Job: The App Server pushes a background task message containing the photo reference to the Message Queue and immediately returns an "Upload Successful" response to the client.Generate Thumbnail: A background Worker pulls the task message from the Queue, fetches the raw image from Object Storage, compresses and resizes it into a 50 KB thumbnail, and saves the thumbnail back into Object Storage under a distinct key linked to the original post.

8. Trade-offsAsynchronous Thumbnail Generation vs. Immediate Availability: Using a queue and worker keeps the upload response fast for the user, but means thumbnails may take a few seconds to appear in feeds after an upload completes.Eventual Consistency vs. Strong Consistency (Read Replicas): Directing feed reads to database read replicas offloads traffic from the primary database, but introduces a brief replication lag where a user's newly uploaded post might not instantly appear when they refresh their own feed.9. Git Commit Instruction