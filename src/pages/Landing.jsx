import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaUtensils, FaArrowRight, FaClock, FaCheckCircle, FaStar, FaStore, FaHeart, FaCookieBite, FaShieldAlt } from 'react-icons/fa';

const Landing = () => {
  const { user } = useContext(AuthContext);

  return (
    <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)', overflow: 'hidden' }}>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '6rem 2rem 5rem 2rem',
          background: 'radial-gradient(circle at 70% 30%, rgba(249, 115, 22, 0.12) 0%, transparent 60%)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '2rem',
          }}
        >
          {/* Hero Left Content */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                padding: '0.5rem 1rem',
                borderRadius: '50px',
                width: 'fit-content',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: '1px solid rgba(249, 115, 22, 0.25)',
              }}
            >
              <FaCookieBite />
              <span>Taste the Authenticity</span>
            </div>
            
            <h1
              style={{
                fontSize: '3.75rem',
                lineHeight: 1.1,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.03em',
                textAlign: 'center',
              }}
            >
              Gourmet Home Meals,<br />
              <span className="gradient-text">Crafted in Your Neighborhood.</span>
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto', textAlign: 'center' }}>
              Connect with passionate local home chefs, explore customized family recipes, and bring the warmth of authentic cooking back to your dinner table. No mass production. Just pure food love.
            </p>

            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.9rem 2rem', borderRadius: '50px', fontSize: '1rem' }}>
                Order Fresh Food <FaArrowRight />
              </Link>
              <Link to="/register" className="btn btn-secondary" style={{ padding: '0.9rem 2rem', borderRadius: '50px', fontSize: '1rem' }}>
                Join as a Chef
              </Link>
            </div>

            {/* Quick trust badges */}
            <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <FaCheckCircle style={{ color: 'var(--secondary)' }} />
                <span>100% Home Cooked</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <FaShieldAlt style={{ color: 'var(--primary)' }} />
                <span>Verified Kitchens</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <FaClock style={{ color: 'var(--info)' }} />
                <span>On-Demand Fresh Prep</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ background: 'var(--bg-secondary)', padding: '2rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', fontWeight: 800, fontFamily: 'var(--font-display)' }}>1,500+</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Delighted Neighborhood Customers</p>
          </div>
          <div>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', fontWeight: 800, fontFamily: 'var(--font-display)' }}>120+</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Active Local Home Chefs</p>
          </div>
          <div>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', fontWeight: 800, fontFamily: 'var(--font-display)' }}>15,000+</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Freshly Cooked Meals Served</p>
          </div>
          <div>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', fontWeight: 800, fontFamily: 'var(--font-display)' }}>4.9★</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Average Cook Quality Rating</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: '6rem 2rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>How HomeCook Connect Works</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6' }}>
              We bridge the gap between talented home kitchen makers and individuals looking for healthy, fresh food.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', flexWrap: 'wrap' }}>
            {/* Foodies Column */}
            <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--secondary-light)', color: 'var(--secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyText: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  <FaHeart />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>For Food Lovers</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>01.</div>
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Explore Local Menus</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Browse unique dishes, snacks, and meal preps from talented neighbors near you.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>02.</div>
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Customize Your Request</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Have special dietary needs? Message the chef directly to modify spice levels, ingredients, or portions.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>03.</div>
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Track & Taste</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Receive instant notifications when your order goes from cooking to packaging, ready for fresh pickup.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chefs Column */}
            <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-lg)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyText: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  <FaStore />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>For Kitchen Chefs</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>01.</div>
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Set Up Your Kitchen</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Create your free chef profile, upload images of your kitchen, and add your signature specialties.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>02.</div>
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Accept Order Requests</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Receive orders directly and organize prep slots so cooking fits beautifully into your own schedule.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>03.</div>
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Grow and Earn</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Receive payments directly, build long-term neighborhood regulars, and get rewarded with 5-star ratings.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: 'var(--bg-secondary)', padding: '6rem 2rem', display: 'flex', justifyText: 'center', justifyContent: 'center', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>Loved by the Community</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Read what our neighborhood has to say about HomeCook Connect.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', color: 'var(--warning)', gap: '0.25rem' }}>
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p style={{ fontSize: '0.95rem', fontStyle: 'italic', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                "As a busy mother who works full-time, finding Chef Ayesha's kitchen was a life-saver. The food is absolutely delicious, extremely clean, and tastes exactly like my mom's home cooking."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)' }}>S</div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Shikha Sharma</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer since 2025</span>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', color: 'var(--warning)', gap: '0.25rem' }}>
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p style={{ fontSize: '0.95rem', fontStyle: 'italic', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                "Cooking has been my passion for 15 years, but I never knew how to sell my food. This platform gave me an easy way to setup my neighborhood menu. I now serve 20+ regulars weekly!"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--secondary)' }}>M</div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Maria Del-Rosario</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Homemaker Chef</span>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', color: 'var(--warning)', gap: '0.25rem' }}>
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p style={{ fontSize: '0.95rem', fontStyle: 'italic', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                "The custom request feature is incredible. I have a gluten sensitivity, and I was able to request gluten-free lasagna from a local chef. It arrived piping hot and was outstanding!"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--info)' }}>D</div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Daniel K.</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer since 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section
        style={{
          padding: '6rem 2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(22, 30, 49, 0.5) 100%)',
          display: 'flex',
          justifyContent: 'center',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Ready to Taste the Difference?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Join our local food community today. Whether you want to order authentic meals or share your own kitchen creations, registration is completely free.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.9rem 2.2rem', borderRadius: '50px', fontSize: '1rem' }}>
              Create Account Today
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.9rem 2.2rem', borderRadius: '50px', fontSize: '1rem' }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Sleek Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '3rem 2rem', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.2rem' }}>
            <FaUtensils style={{ color: 'var(--primary)' }} />
            <span>HomeCook<span style={{ color: 'var(--primary)' }}>Connect</span></span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Link to="/login" style={{ transition: 'var(--transition-fast)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Login</Link>
            <Link to="/register" style={{ transition: 'var(--transition-fast)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Sign Up</Link>
            <span style={{ color: 'var(--text-muted)' }}>&copy; {new Date().getFullYear()} HomeCook Connect. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
