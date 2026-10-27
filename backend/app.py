import os, json, time
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS

STATIC_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
app = Flask(__name__, static_folder=STATIC_ROOT, static_url_path='')
CORS(app)
CAPTURED_ROUTES = json.loads("[]")
STATE_DB = {"users": [], "items": []}

@app.route('/<path:subpath>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def catch_all(subpath):
    req_path = '/' + subpath
    for route in CAPTURED_ROUTES:
        if route.get('path') == req_path and route.get('method', 'GET').upper() == request.method:
            body = route.get('response_body', {})
            if isinstance(body, (dict, list)):
                return jsonify(body), route.get('status', 200)
            return Response(str(body), status=route.get('status', 200))
    if subpath.startswith('api/'):
        if request.method == 'GET':
            return jsonify({"success": True, "items": STATE_DB["items"]})
        record = {"id": int(time.time() * 1000), "path": req_path, "payload": request.get_json(silent=True) or {}}
        STATE_DB["items"].append(record)
        return jsonify({"success": True, "data": record})
    full_static = os.path.join(STATIC_ROOT, subpath)
    if os.path.isfile(full_static):
        return send_from_directory(STATIC_ROOT, subpath)
    return send_from_directory(STATIC_ROOT, 'index.html')

@app.route('/')
def index():
    return send_from_directory(STATIC_ROOT, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
