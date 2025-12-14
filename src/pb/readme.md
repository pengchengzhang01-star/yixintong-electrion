> # Protobuf
>
> npx pbjs meeting.proto --ts meeting.pb.ts

> # Protobuf with options
>
> npx pbjs -t static-module -w es6 -o meeting.pb.js meeting.proto
> npx pbts -o meeting.d.ts meeting.pb.js
