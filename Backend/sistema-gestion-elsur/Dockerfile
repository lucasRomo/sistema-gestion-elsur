# Imagen para Render (Render no tiene entorno nativo de Java: el backend se despliega como Docker).

# ---- Etapa 1: compilar el jar ----
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

# Primero solo lo necesario para bajar dependencias: así Docker cachea esta capa y los
# deploys siguientes no vuelven a descargar todo Maven si no cambió el pom.xml.
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src src
RUN ./mvnw -B -q package -DskipTests

# ---- Etapa 2: imagen liviana solo con el JRE ----
FROM eclipse-temurin:25-jre
WORKDIR /app

RUN useradd --system --create-home elsur
COPY --from=build /app/target/*.jar app.jar
USER elsur

# Render free tiene 512 MB: limitar el heap a un porcentaje del contenedor evita que el
# proceso sea matado por exceder la memoria.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k -Duser.timezone=America/Argentina/Buenos_Aires"
# Render corre en UTC: sin esto "hoy" cambiaba a las 21:00 de Argentina (cierre de caja,
# movimientos del día, fechas de pedidos) y las fechas nuevas quedaban 3 horas corridas.
ENV TZ=America/Argentina/Buenos_Aires

EXPOSE 8080
# Render inyecta la variable PORT; application.properties la toma con server.port=${PORT:8080}
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
