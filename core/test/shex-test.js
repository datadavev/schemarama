/**
 * Copyright 2020 Anastasiia Byvsheva & Dan Brickley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ShexValidator = require('../shexValidator').Validator;

const testsPath = path.join(__dirname, 'data', 'tests');
const answersPath = path.join(__dirname, 'data', 'answers');
const shapesPath = path.join(__dirname, 'data', 'shapes');

function stringifyFailure(failure) {
    let keys = Object.keys(failure);
    keys.sort();
    return keys.map(key => `${key}:${failure[key]}`).join(';');
}


async function test(validator, test, valid, shapeId) {
    let data = fs.readFileSync(path.join(testsPath, test)).toString();
    let answer = JSON.parse(fs.readFileSync(path.join(answersPath, valid)).toString());
    let res = await validator.validate(data, shapeId);
    res.failures.forEach(failure => delete failure['message']);

    let actual = res.failures.map(stringifyFailure);
    let expected = answer.map(stringifyFailure);
    actual.sort();
    expected.sort();

    return assert.deepEqual(actual, expected);
}

describe('ShEx Missing property tests', function () {
    let shapes = fs.readFileSync(path.join(shapesPath, 'Schema.shex')).toString();
    let validator = new ShexValidator(shapes);
    it("should return error if the property is missing", function () {
        return test(validator, 'Thing1.txt', 'Thing-mp.json', 'https://schema.org/validation#Thing');
    });
    it("should not fail if data has all required properties", function () {
        return test(validator, 'Thing2.txt', 'empty.json', 'https://schema.org/validation#Thing');
    });
});

describe('ShEx Type mismatch tests', function () {
    let shapes = fs.readFileSync(path.join(shapesPath, 'Schema.shex')).toString();
    let validator = new ShexValidator(shapes);
    it("should fail with TypeMismatch if regex is failing", function () {
        return test(validator, 'Thing3.txt', 'Thing-tm.json', 'https://schema.org/validation#Thing');
    });
    it("should fail with TypeMismatch and MissingProperty", function () {
        return test(validator, 'Thing4.txt', 'Thing-tmmp.json', 'https://schema.org/validation#Thing');
    })
});

describe('ShEx Annotation tests', function () {
    let shapes = fs.readFileSync(path.join(shapesPath, 'Schema.shex')).toString();
    let annotations = {
        description: 'http://www.w3.org/2000/01/rdf-schema#comment',
        severity: 'http://www.w3.org/2000/01/rdf-schema#label'
    }
    let validator = new ShexValidator(shapes, {annotations: annotations});
    it("should add annotations if specified", function () {
        return test(validator, 'Thing4.txt', 'Thing-tmmp-annot.json', 'https://schema.org/validation#Thing');
    });
});


describe('ShEx Extension tests', function () {
    let shapes = fs.readFileSync(path.join(shapesPath, 'Schema.shex')).toString();
    let validator = new ShexValidator(shapes);
    it("should deal with extensions", function () {
        return test(validator, 'CreativeWork1.txt', 'CreativeWork-extension.json', 'https://schema.org/validation#CreativeWork');
    })
});


describe('ShEx Input data formats tests', function () {
    let shapes = fs.readFileSync(path.join(shapesPath, 'Schema.shex')).toString();
    let validator = new ShexValidator(shapes);
    it("should support JSON-LD", function () {
        return test(validator, 'Thing4.txt', 'Thing-tmmp.json', 'https://schema.org/validation#Thing');
    });
    it("should support Microdata", function () {
        return test(validator, 'Thing4-Microdata.txt', 'Thing-tmmp.json', 'https://schema.org/validation#Thing');
    });
    it("should support RDFa", function () {
        return test(validator, 'Thing4-rdfa.txt', 'Thing-tmmp.json', 'https://schema.org/validation#Thing');
    });
});