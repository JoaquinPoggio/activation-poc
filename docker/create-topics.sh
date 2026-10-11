#!/bin/bash
# Crea los 4 topics de negocio y sus DLQ: 3 particiones, retención de 7 días
BOOTSTRAP=kafka:19092
KT=/opt/kafka/bin/kafka-topics.sh
TOPICS="activation.requested billing.events provisioning.events activation.events"

for t in $TOPICS; do
  for name in $t $t.dlq; do
    $KT --bootstrap-server $BOOTSTRAP --create --if-not-exists \
        --topic $name --partitions 3 --replication-factor 1 \
        --config retention.ms=604800000
  done
done

$KT --bootstrap-server $BOOTSTRAP --list
