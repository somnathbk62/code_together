package com.cometchat.sample;

import org.junit.runner.RunWith;
import org.junit.runners.Suite;

/**
 * Test suite to run all instrumented tests.
 */
@RunWith(Suite.class)
@Suite.SuiteClasses({
    TestClasses.class,
    ExampleInstrumentedTest.class
})
public class AndroidTestSuite {
    // This class is just a holder for the suite annotation
}
