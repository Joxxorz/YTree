#!/usr/bin/env bash
set -euo pipefail
# Cloud onboarding only. Local developers can use their installed JDK and Maven.
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
tools_dir=/workspace/tools
mkdir -p "$tools_dir"
if [[ ! -x "$tools_dir/apache-maven-3.9.11/bin/mvn" ]]; then
  download_dir=$(mktemp -d)
  curl -fsSL https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.11/apache-maven-3.9.11-bin.tar.gz -o "$download_dir/maven.tar.gz"
  curl -fsSL https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.11/apache-maven-3.9.11-bin.tar.gz.sha512 -o "$download_dir/maven.sha512"
  python3 - "$download_dir" <<'PY'
import hashlib,sys,pathlib
p=pathlib.Path(sys.argv[1])
assert hashlib.sha512((p/'maven.tar.gz').read_bytes()).hexdigest()==(p/'maven.sha512').read_text().strip()
PY
  tar -xzf "$download_dir/maven.tar.gz" -C "$tools_dir"
  rm -rf "$download_dir"
fi
if [[ ! -x "$tools_dir/jdk/bin/javac" ]]; then
  download_dir=$(mktemp -d)
  curl -fsSL https://download.oracle.com/java/21/latest/jdk-21_linux-x64_bin.tar.gz -o "$download_dir/jdk.tar.gz"
  curl -fsSL https://download.oracle.com/java/21/latest/jdk-21_linux-x64_bin.tar.gz.sha256 -o "$download_dir/jdk.sha256"
  python3 - "$download_dir" <<'PY'
import hashlib,sys,pathlib
p=pathlib.Path(sys.argv[1])
assert hashlib.sha256((p/'jdk.tar.gz').read_bytes()).hexdigest()==(p/'jdk.sha256').read_text().split()[0]
PY
  mkdir -p "$tools_dir/jdk"
  tar -xzf "$download_dir/jdk.tar.gz" -C "$tools_dir/jdk" --strip-components=1
  rm -rf "$download_dir"
fi
export JAVA_HOME="$tools_dir/jdk"
export PATH="$JAVA_HOME/bin:$tools_dir/apache-maven-3.9.11/bin:$PATH"
# Use the machine's trusted certificates, including its managed proxy CA.
if [[ -f /etc/ssl/certs/java/cacerts ]]; then
 export MAVEN_OPTS="${MAVEN_OPTS:-} -Djavax.net.ssl.trustStore=/etc/ssl/certs/java/cacerts"
fi
python3 - "$tools_dir/maven-settings.xml" <<'PY'
import os,sys,urllib.parse,xml.etree.ElementTree as E
r=E.Element('settings')
u=urllib.parse.urlsplit(os.environ.get('HTTPS_PROXY',''))
if u.hostname:
 if u.username or u.password: raise RuntimeError('Authenticated proxy needs supported Maven credential configuration')
 p=E.SubElement(E.SubElement(r,'proxies'),'proxy')
 for k,v in [('id','cloud'),('active','true'),('protocol','http'),('host',u.hostname),('port',str(u.port or 80)),('nonProxyHosts','localhost|127.0.0.1')]: E.SubElement(p,k).text=v
E.ElementTree(r).write(sys.argv[1])
PY
cd "$project_dir/backend"
mvn -B -ntp -s "$tools_dir/maven-settings.xml" -Dmaven.repo.local="$tools_dir/m2" verify
cd "$project_dir/frontend"
npm ci --cache "$tools_dir/npm-cache" --no-audit --no-fund
npm run build
npm test
