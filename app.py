import xml.etree.ElementTree as ET
import requests
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/release-notes")
def get_release_notes():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        
        # Parse XML
        root = ET.fromstring(response.content)
        
        # Atom Namespace map
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title_el = entry.find('atom:title', ns)
            id_el = entry.find('atom:id', ns)
            updated_el = entry.find('atom:updated', ns)
            content_el = entry.find('atom:content', ns)
            
            # Find alternate link
            link = ""
            for l in entry.findall('atom:link', ns):
                if l.attrib.get('rel') == 'alternate' or l.attrib.get('rel') is None:
                    link = l.attrib.get('href', '')
                    break
            
            entries.append({
                'title': title_el.text if title_el is not None else "",
                'id': id_el.text if id_el is not None else "",
                'updated': updated_el.text if updated_el is not None else "",
                'link': link,
                'content': content_el.text if content_el is not None else ""
            })
            
        return jsonify(entries)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
